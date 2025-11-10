import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type Message = {
  id: string;
  sender_type: 'user' | 'companion';
  content: string;
  created_at: string;
  read?: boolean;
  listened?: boolean;
  media_url?: string;
  media_type?: string;
  media_thumbnail?: string;
  audio_duration?: number;
  reply_to_message_id?: string;
};

export const useChat = (chatId: string, companionId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loadMessages = useCallback(async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('chat_messages')
        .select('id, sender_type, content, created_at, read, listened, media_url, media_type, media_thumbnail, audio_duration')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error",
        description: "Failed to load chat history",
        variant: "destructive",
      });
    }
  }, [chatId, toast]);

  const sendMessage = useCallback(async (content: string, mediaUrl?: string | null, mediaType?: 'image' | 'video' | 'audio' | null, audioDuration?: number, replyToMessageId?: string) => {
    if (!content.trim() && !mediaUrl) return;

    // Check daily chat limit
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data: limitCheck, error: limitError } = await supabase.rpc(
        'check_daily_chat_limit',
        { p_user_id: user.user.id }
      ) as { data: { allowed: boolean; remaining: number; used: number; limit: number } | null; error: any };

      if (limitError) {
        console.error('Error checking chat limit:', limitError);
        toast({
          title: "Error",
          description: "Failed to check message limit",
          variant: "destructive",
        });
        return;
      }

      if (limitCheck && !limitCheck.allowed) {
        toast({
          title: "Daily limit reached",
          description: `You've used all ${limitCheck.limit} messages today. Limit resets at midnight UTC.`,
          variant: "destructive",
        });
        return;
      }
    } catch (error) {
      console.error('Error checking chat limit:', error);
      toast({
        title: "Error",
        description: "Failed to check message limit",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    // Add user message to UI immediately
    const userMsg: Message = {
      id: crypto.randomUUID(),
      sender_type: 'user',
      content,
      created_at: new Date().toISOString(),
      media_url: mediaUrl || undefined,
      media_type: mediaType || undefined,
      audio_duration: audioDuration,
      reply_to_message_id: replyToMessageId,
    };
    setMessages(prev => [...prev, userMsg]);

    // Save user message to DB
    try {
      const { error: saveError } = await (supabase as any)
        .from('chat_messages')
        .insert({
          chat_id: chatId,
          sender_type: 'user',
          content,
          media_url: mediaUrl,
          media_type: mediaType,
          audio_duration: audioDuration,
          reply_to_message_id: replyToMessageId,
        });

      if (saveError) throw saveError;
    } catch (error) {
      console.error('Error saving message:', error);
      toast({
        title: "Error",
        description: "Failed to save message",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Stream AI response
    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
      
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ chatId, message: content, companionId, mediaUrl, mediaType }),
      });

      if (resp.status === 429 || resp.status === 402) {
        const errorData = await resp.json();
        toast({
          title: "Error",
          description: errorData.error,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (!resp.ok || !resp.body) throw new Error("Failed to start stream");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;
      let assistantContent = "";
      let assistantMsgId = crypto.randomUUID();

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (delta) {
              assistantContent += delta;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.id === assistantMsgId) {
                  return prev.map(m => m.id === assistantMsgId ? { ...m, content: assistantContent } : m);
                }
                return [...prev, {
                  id: assistantMsgId,
                  sender_type: 'companion' as const,
                  content: assistantContent,
                  created_at: new Date().toISOString(),
                }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Save assistant message to DB
      if (assistantContent) {
        await (supabase as any).from('chat_messages').insert({
          chat_id: chatId,
          sender_type: 'companion',
          content: assistantContent,
        });

        // Update chat stats
        await (supabase as any).rpc('increment_chat_message_count', { chat_id_param: chatId });
      }

    } catch (error) {
      console.error('Error streaming message:', error);
      toast({
        title: "Error",
        description: "Failed to get AI response",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [chatId, companionId, toast]);

  return {
    messages,
    isLoading,
    sendMessage,
    loadMessages,
  };
};
