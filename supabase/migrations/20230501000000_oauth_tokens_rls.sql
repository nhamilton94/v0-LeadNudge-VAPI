-- Enable Row Level Security
ALTER TABLE oauth2.user_oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to only see their own tokens
CREATE POLICY "Users can view their own tokens"
  ON oauth2.user_oauth_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own tokens
CREATE POLICY "Users can insert their own tokens"
  ON oauth2.user_oauth_tokens
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own tokens
CREATE POLICY "Users can update their own tokens"
  ON oauth2.user_oauth_tokens
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own tokens
CREATE POLICY "Users can delete their own tokens"
  ON oauth2.user_oauth_tokens
  FOR DELETE
  USING (auth.uid() = user_id);

-- Grant service role access for token refresh mechanism
GRANT ALL ON oauth2.user_oauth_tokens TO service_role;
