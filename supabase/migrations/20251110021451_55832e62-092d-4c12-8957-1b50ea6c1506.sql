-- Add media support columns to chat_messages
ALTER TABLE public.chat_messages
ADD COLUMN media_url text,
ADD COLUMN media_type text,
ADD COLUMN media_thumbnail text;

-- Add media support columns to user_messages
ALTER TABLE public.user_messages
ADD COLUMN media_url text,
ADD COLUMN media_type text,
ADD COLUMN media_thumbnail text;

-- Create chat-media storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for chat-media bucket
CREATE POLICY "Users can upload their own chat media"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'chat-media' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Chat media is viewable by everyone"
ON storage.objects
FOR SELECT
USING (bucket_id = 'chat-media');

CREATE POLICY "Users can update their own chat media"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'chat-media' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own chat media"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'chat-media' AND
  auth.uid()::text = (storage.foldername(name))[1]
);