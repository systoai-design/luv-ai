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

interface Reaction {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read: boolean;
  listened?: boolean;
  media_url?: string;
  media_type?: string;
  media_thumbnail?: string;
  audio_duration?: number;
  reply_to_message_id?: string;
  reactions?: Reaction[];
  quoted_message?: {
    content?: string;
    media_type?: string;
    sender_id?: string;
  };
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
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { typingUsers, setTyping } = useTypingIndicator(matchId);
  const presenceMap = usePresenceDisplay([otherUser.id]);
  const isOnline = presenceMap[otherUser.id]?.online;

  useEffect(() => {
    if (!user) return;
    loadMessages();

    // Mark messages as read when viewing
    const markMessagesAsRead = async () => {
      const unreadMessageIds = messages
        .filter(msg => msg.sender_id !== user.id && !msg.read)
        .map(msg => msg.id);
        
      if (unreadMessageIds.length === 0) return;
      
      await supabase
        .from('user_messages')
        .update({ read: true })
        .in('id', unreadMessageIds);
    };

    markMessagesAsRead();

    // Mark match-level unread count as 0
    const markMatchAsRead = async () => {
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

    markMatchAsRead();

    // Subscribe to new messages (INSERT events)
    const insertChannel = supabase
      .channel(`match-insert-${matchId}`)
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

    // Subscribe to message updates (UPDATE events for read/listened status)
    const updateChannel = supabase
      .channel(`match-update-${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_messages',
          filter: `match_id=eq.${matchId}`,
        },
        (payload: any) => {
          setMessages((prev) => 
            prev.map(msg => 
              msg.id === payload.new.id 
                ? { ...msg, read: payload.new.read, listened: payload.new.listened }
                : msg
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(insertChannel);
      supabase.removeChannel(updateChannel);
    };
  }, [matchId, user, messages]);

  const loadMessages = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_messages')
        .select(`
          *,
          quoted_message:reply_to_message_id (
            content,
            media_type,
            sender_id
          )
        `)
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Load reactions for all messages
      const messageIds = data?.map(m => m.id) || [];
      const { data: reactionsData } = await supabase
        .from('message_reactions')
        .select('*')
        .in('message_id', messageIds);

      // Group reactions by message and aggregate
      const reactionsByMessage: Record<string, Reaction[]> = {};
      reactionsData?.forEach((reaction) => {
        if (!reactionsByMessage[reaction.message_id]) {
          reactionsByMessage[reaction.message_id] = [];
        }
        
        const existing = reactionsByMessage[reaction.message_id].find(r => r.emoji === reaction.emoji);
        if (existing) {
          existing.count++;
          if (reaction.user_id === user.id) existing.hasReacted = true;
        } else {
          reactionsByMessage[reaction.message_id].push({
            emoji: reaction.emoji,
            count: 1,
            hasReacted: reaction.user_id === user.id,
          });
        }
      });

      const messagesWithReactions = data?.map(msg => ({
        ...msg,
        reactions: reactionsByMessage[msg.id] || [],
      }));

      setMessages(messagesWithReactions || []);
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
    mediaType?: 'image' | 'video' | 'audio';
    audioDuration?: number;
    replyToMessageId?: string;
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
        audio_duration: payload.audioDuration,
        reply_to_message_id: payload.replyToMessageId,
      });

      if (error) throw error;
      setReplyToMessage(null);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleAudioListened = async (messageId: string) => {
    try {
      await supabase
        .from('user_messages')
        .update({ listened: true, read: true })
        .eq('id', messageId);
    } catch (error) {
      console.error('Error marking audio as listened:', error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      // Optimistic update
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));

      const { error } = await supabase
        .from('user_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
      
      toast.success('Message deleted');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
      // Reload messages on error
      loadMessages();
    }
  };

  const handleReplyToMessage = (messageId: string) => {
    const message = messages.find(msg => msg.id === messageId);
    if (message) {
      setReplyToMessage(message);
    }
  };

  const handleReact = async (messageId: string, emoji: string) => {
    if (!user) return;

    try {
      // Check if user already reacted with this emoji
      const { data: existing } = await supabase
        .from('message_reactions')
        .select('id')
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .eq('emoji', emoji)
        .maybeSingle();

      if (existing) {
        // Remove reaction
        await supabase
          .from('message_reactions')
          .delete()
          .eq('id', existing.id);
      } else {
        // Add reaction
        await supabase
          .from('message_reactions')
          .insert({
            message_id: messageId,
            user_id: user.id,
            emoji,
          });
      }

      // Reload messages to update reactions
      await loadMessages();
    } catch (error) {
      console.error('Error handling reaction:', error);
      toast.error('Failed to react to message');
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
            const quotedMsg = message.quoted_message ? {
              content: message.quoted_message.content,
              mediaType: message.quoted_message.media_type as 'image' | 'video' | 'audio' | undefined,
              senderName: message.quoted_message.sender_id === user?.id ? 'You' : otherUser.display_name || 'User',
              isOwn: message.quoted_message.sender_id === user?.id,
            } : undefined;

            return (
              <ChatMessage
                key={message.id}
                isOwn={isOwn}
                content={message.content}
                createdAt={message.created_at}
                read={message.read}
                listened={message.listened}
                messageId={message.id}
                onMarkListened={handleAudioListened}
                onDelete={isOwn ? handleDeleteMessage : undefined}
                onReply={handleReplyToMessage}
                onReact={handleReact}
                mediaUrl={message.media_url}
                mediaType={message.media_type as 'image' | 'video' | 'audio' | undefined}
                mediaThumbnail={message.media_thumbnail}
                audioDuration={message.audio_duration}
                senderAvatar={otherUser.avatar_url || undefined}
                senderName={otherUser.display_name || undefined}
                showAvatar={false}
                reactions={message.reactions}
                quotedMessage={quotedMsg}
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
          replyToMessage={replyToMessage ? {
            id: replyToMessage.id,
            content: replyToMessage.content,
            mediaType: replyToMessage.media_type as 'image' | 'video' | 'audio' | undefined,
            senderName: replyToMessage.sender_id === user?.id ? 'You' : otherUser.display_name || 'User',
            isOwn: replyToMessage.sender_id === user?.id,
          } : null}
          onCancelReply={() => setReplyToMessage(null)}
        />
      </div>
    </Card>
  );
};

export default MatchChat;
