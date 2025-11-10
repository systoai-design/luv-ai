-- Add DELETE policies for user_messages (users can delete their own messages)
CREATE POLICY "Users can delete their own messages"
ON public.user_messages
FOR DELETE
USING (auth.uid() = sender_id);

-- Add DELETE policy for chat_messages (users can delete their own messages)
CREATE POLICY "Users can delete their own messages"
ON public.chat_messages
FOR DELETE
USING (
  auth.uid() IN (
    SELECT user_id FROM user_chats WHERE id = chat_messages.chat_id
  )
  AND sender_type = 'user'
);