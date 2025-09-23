-- Messaging System Database Schema
-- This creates tables for storing Twilio and Botpress conversations and messages

-- Create conversations table
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  botpress_conversation_id TEXT UNIQUE,
  twilio_conversation_sid TEXT UNIQUE,
  phone_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'paused')),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create messages table
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  source TEXT NOT NULL CHECK (source IN ('twilio', 'botpress', 'manual')),
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'media', 'system')),
  content TEXT NOT NULL,
  twilio_message_sid TEXT,
  botpress_message_id TEXT,
  delivery_status TEXT NOT NULL DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'delivered', 'failed', 'read')),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for performance
CREATE INDEX idx_conversations_contact_id ON conversations(contact_id);
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_botpress_id ON conversations(botpress_conversation_id);
CREATE INDEX idx_conversations_twilio_sid ON conversations(twilio_conversation_sid);
CREATE INDEX idx_conversations_phone ON conversations(phone_number);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_created_at ON conversations(created_at);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_direction ON messages(direction);
CREATE INDEX idx_messages_source ON messages(source);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_twilio_sid ON messages(twilio_message_sid);
CREATE INDEX idx_messages_botpress_id ON messages(botpress_message_id);
CREATE INDEX idx_messages_delivery_status ON messages(delivery_status);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_conversations_updated_at 
  BEFORE UPDATE ON conversations 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations table
-- Users can only see conversations they own or are assigned to
CREATE POLICY "Users can view their own conversations" ON conversations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own conversations" ON conversations
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own conversations" ON conversations
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own conversations" ON conversations
  FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for messages table
-- Users can only see messages from conversations they own
CREATE POLICY "Users can view messages from their conversations" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages to their conversations" ON messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update messages from their conversations" ON messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages from their conversations" ON messages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.user_id = auth.uid()
    )
  );

-- Service role policies (for API operations)
-- These allow the service role to perform operations without RLS restrictions
CREATE POLICY "Service role full access to conversations" ON conversations
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to messages" ON messages
  FOR ALL USING (auth.role() = 'service_role');

-- Create a view for conversation summaries
CREATE VIEW conversation_summaries AS
SELECT 
  c.id,
  c.created_at,
  c.updated_at,
  c.contact_id,
  c.user_id,
  c.botpress_conversation_id,
  c.twilio_conversation_sid,
  c.phone_number,
  c.status,
  c.metadata,
  contacts.name as contact_name,
  contacts.email as contact_email,
  profiles.full_name as assigned_agent,
  (
    SELECT COUNT(*) 
    FROM messages m 
    WHERE m.conversation_id = c.id
  ) as message_count,
  (
    SELECT m.created_at 
    FROM messages m 
    WHERE m.conversation_id = c.id 
    ORDER BY m.created_at DESC 
    LIMIT 1
  ) as last_message_at,
  (
    SELECT m.content 
    FROM messages m 
    WHERE m.conversation_id = c.id 
    ORDER BY m.created_at DESC 
    LIMIT 1
  ) as last_message_content
FROM conversations c
LEFT JOIN contacts ON c.contact_id = contacts.id
LEFT JOIN profiles ON c.user_id = profiles.id;

-- Grant permissions on the view
GRANT SELECT ON conversation_summaries TO authenticated;

-- Enable RLS on the view (inherits from base tables)
ALTER VIEW conversation_summaries SET (security_invoker = true);