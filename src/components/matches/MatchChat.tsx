import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { usePresenceDisplay } from '@/hooks/usePresenceDisplay';
import { ChatComposer } from '@/components/chat/ChatComposer';
import { ChatMessage } from '@/components/chat/ChatMessage';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read: boolean;
  media_url?: string;
  media_type?: string;
  media_thumbnail?: string;
}

interface MatchChatProps {
  matchId: string;
  otherUser: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

const MatchChat = ({ matchId, otherUser }: MatchChatProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { typingUsers, setTyping } = useTypingIndicator(matchId);
  const presenceMap = usePresenceDisplay([otherUser.id]);
  const isOnline = presenceMap[otherUser.id]?.online;

  useEffect(() => {
    if (!user) return;
    loadMessages();

    // Mark messages as read
    const markAsRead = async () => {
      const { data: match } = await supabase
        .from('matches')
        .select('user_id_1, user_id_2')
        .eq('id', matchId)
        .single();

      if (!match) return;

      const isUser1 = match.user_id_1 === user.id;
      const updateField = isUser1 ? 'unread_count_1' : 'unread_count_2';

      await supabase
        .from('matches')
        .update({ [updateField]: 0 })
        .eq('id', matchId);
    };

    markAsRead();

    // Subscribe to new messages
    const channel = supabase
      .channel(`match-${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_messages',
          filter: `match_id=eq.${matchId}`,
        },
        (payload: any) => {
          setMessages((prev) => [...prev, payload.new]);
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, user]);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('user_messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      scrollToBottom();
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSend = async (payload: { 
    text: string; 
    mediaUrl?: string; 
    mediaType?: 'image' | 'video' 
  }) => {
    if (!user || sending) return;

    setSending(true);
    setTyping(false);

    try {
      const { error } = await supabase.from('user_messages').insert({
        match_id: matchId,
        sender_id: user.id,
        content: payload.text,
        media_url: payload.mediaUrl,
        media_type: payload.mediaType,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="bg-card border-border flex flex-col h-[600px]">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center gap-3">
        <div className="relative">
          <Avatar>
            <AvatarImage src={otherUser.avatar_url || ''} alt={otherUser.display_name || 'User'} />
            <AvatarFallback>{otherUser.display_name?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
          {isOnline && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold">{otherUser.display_name || 'Anonymous'}</h3>
          {typingUsers.length > 0 ? (
            <p className="text-xs text-muted-foreground animate-pulse">typing...</p>
          ) : (
            <p className={`text-xs font-medium ${isOnline ? 'text-green-500' : 'text-muted-foreground'}`}>
              {presenceMap[otherUser.id]?.formattedLastSeen || 'Offline'}
            </p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.sender_id === user?.id;
            return (
              <ChatMessage
                key={message.id}
                isOwn={isOwn}
                content={message.content}
                createdAt={message.created_at}
                mediaUrl={message.media_url}
                mediaType={message.media_type as 'image' | 'video' | undefined}
                mediaThumbnail={message.media_thumbnail}
                senderAvatar={otherUser.avatar_url || undefined}
                senderName={otherUser.display_name || undefined}
                showAvatar={false}
              />
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-card/50 backdrop-blur-sm">
        <ChatComposer
          onSend={handleSend}
          placeholder="Type a message..."
          disabled={sending}
          isLoading={sending}
        />
      </div>
    </Card>
  );
};

export default MatchChat;
