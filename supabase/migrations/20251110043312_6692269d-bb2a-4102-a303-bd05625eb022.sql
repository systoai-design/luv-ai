-- Create message_reactions table for user messages
CREATE TABLE public.message_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.user_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

-- Create index for faster lookups
CREATE INDEX idx_message_reactions_message_id ON public.message_reactions(message_id);
CREATE INDEX idx_message_reactions_user_id ON public.message_reactions(user_id);

-- Enable RLS
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view reactions in their matches"
  ON public.message_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_messages um
      INNER JOIN public.matches m ON m.id = um.match_id
      WHERE um.id = message_reactions.message_id
      AND (m.user_id_1 = auth.uid() OR m.user_id_2 = auth.uid())
    )
  );

CREATE POLICY "Users can add reactions to messages in their matches"
  ON public.message_reactions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.user_messages um
      INNER JOIN public.matches m ON m.id = um.match_id
      WHERE um.id = message_reactions.message_id
      AND (m.user_id_1 = auth.uid() OR m.user_id_2 = auth.uid())
    )
  );

CREATE POLICY "Users can remove their own reactions"
  ON public.message_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- Create chat_message_reactions table for AI chat messages
CREATE TABLE public.chat_message_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

-- Create index for faster lookups
CREATE INDEX idx_chat_message_reactions_message_id ON public.chat_message_reactions(message_id);
CREATE INDEX idx_chat_message_reactions_user_id ON public.chat_message_reactions(user_id);

-- Enable RLS
ALTER TABLE public.chat_message_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for AI chat reactions
CREATE POLICY "Users can view reactions in their chats"
  ON public.chat_message_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_messages cm
      INNER JOIN public.user_chats uc ON uc.id = cm.chat_id
      WHERE cm.id = chat_message_reactions.message_id
      AND uc.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add reactions to messages in their chats"
  ON public.chat_message_reactions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.chat_messages cm
      INNER JOIN public.user_chats uc ON uc.id = cm.chat_id
      WHERE cm.id = chat_message_reactions.message_id
      AND uc.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove their own chat reactions"
  ON public.chat_message_reactions FOR DELETE
  USING (auth.uid() = user_id);