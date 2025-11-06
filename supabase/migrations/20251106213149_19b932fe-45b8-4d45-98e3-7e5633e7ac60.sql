-- Create user_chats table
CREATE TABLE public.user_chats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  companion_id UUID NOT NULL REFERENCES public.ai_companions(id) ON DELETE CASCADE,
  total_messages INTEGER NOT NULL DEFAULT 0,
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, companion_id)
);

-- Create chat_messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID NOT NULL REFERENCES public.user_chats(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'companion')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_chats
CREATE POLICY "Users can view their own chats"
  ON public.user_chats
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chats"
  ON public.user_chats
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chats"
  ON public.user_chats
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chats"
  ON public.user_chats
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for chat_messages
CREATE POLICY "Users can view messages from their chats"
  ON public.chat_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_chats
      WHERE user_chats.id = chat_messages.chat_id
      AND user_chats.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in their chats"
  ON public.chat_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_chats
      WHERE user_chats.id = chat_messages.chat_id
      AND user_chats.user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX idx_user_chats_user_id ON public.user_chats(user_id);
CREATE INDEX idx_user_chats_companion_id ON public.user_chats(companion_id);
CREATE INDEX idx_chat_messages_chat_id ON public.chat_messages(chat_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at);

-- Create trigger for user_chats updated_at
CREATE TRIGGER update_user_chats_updated_at
  BEFORE UPDATE ON public.user_chats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create RPC function to increment message count
CREATE OR REPLACE FUNCTION public.increment_chat_message_count(chat_id_param UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_chats 
  SET total_messages = total_messages + 1,
      last_message_at = now()
  WHERE id = chat_id_param;
END;
$$;