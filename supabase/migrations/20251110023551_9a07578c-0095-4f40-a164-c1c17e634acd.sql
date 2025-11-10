-- Add audio_duration column to chat messages tables
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS audio_duration integer;
ALTER TABLE user_messages ADD COLUMN IF NOT EXISTS audio_duration integer;