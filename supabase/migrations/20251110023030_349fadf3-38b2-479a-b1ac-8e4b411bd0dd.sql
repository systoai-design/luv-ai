-- Enable full row replication for user_messages table
-- This ensures all column values (including media fields) are broadcast in real-time events
ALTER TABLE user_messages REPLICA IDENTITY FULL;