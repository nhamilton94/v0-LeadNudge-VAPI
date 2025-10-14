-- Add is_read column to messages table
ALTER TABLE messages ADD COLUMN is_read BOOLEAN DEFAULT true;

-- Create index for better performance when querying unread messages
CREATE INDEX idx_messages_is_read ON messages (conversation_id, direction, is_read);

-- Set existing messages as read (since they're already in the system)
UPDATE messages SET is_read = true WHERE is_read IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN messages.is_read IS 'Indicates whether the message has been read by the property owner. Applies to both inbound and outbound messages for conversation monitoring.';