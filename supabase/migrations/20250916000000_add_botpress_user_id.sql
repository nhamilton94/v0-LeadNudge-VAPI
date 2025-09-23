-- Add botpress_user_id column to conversations table
ALTER TABLE conversations ADD COLUMN botpress_user_id TEXT;

-- Add comment for documentation
COMMENT ON COLUMN conversations.botpress_user_id IS 'Botpress user ID for integration tracking';