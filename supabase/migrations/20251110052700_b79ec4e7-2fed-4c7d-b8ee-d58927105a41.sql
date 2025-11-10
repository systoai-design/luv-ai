-- Create message_deletions table for soft delete functionality
CREATE TABLE IF NOT EXISTS public.message_deletions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL,
  user_id uuid NOT NULL,
  message_type text NOT NULL CHECK (message_type IN ('user_message', 'chat_message')),
  deleted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, message_type)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_message_deletions_user ON public.message_deletions(user_id);
CREATE INDEX IF NOT EXISTS idx_message_deletions_message ON public.message_deletions(message_id, message_type);

-- Enable RLS
ALTER TABLE public.message_deletions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can insert their own deletions"
  ON public.message_deletions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own deletions"
  ON public.message_deletions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can remove their own deletions"
  ON public.message_deletions FOR DELETE
  USING (auth.uid() = user_id);