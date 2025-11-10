-- Add reply_to_message_id column to user_messages and chat_messages tables
ALTER TABLE user_messages 
ADD COLUMN IF NOT EXISTS reply_to_message_id uuid REFERENCES user_messages(id) ON DELETE SET NULL;

ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS reply_to_message_id uuid REFERENCES chat_messages(id) ON DELETE SET NULL;

-- Add indexes for better performance when fetching quoted messages
CREATE INDEX IF NOT EXISTS idx_user_messages_reply_to ON user_messages(reply_to_message_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_reply_to ON chat_messages(reply_to_message_id);