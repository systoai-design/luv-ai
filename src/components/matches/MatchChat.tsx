import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { usePresenceDisplay } from '@/hooks/usePresenceDisplay';
import { MediaUpload } from '@/components/chat/MediaUpload';
import { MediaPreview } from '@/components/chat/MediaPreview';

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
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);

    // Set typing indicator
    if (value.length > 0) {
      setTyping(true, otherUser.display_name || undefined);

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        setTyping(false);
      }, 3000);
    } else {
      setTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !mediaUrl) || !user || sending) return;

    setSending(true);
    
    // Stop typing indicator
    setTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    try {
      const { error } = await supabase.from('user_messages').insert({
        match_id: matchId,
        sender_id: user.id,
        content: newMessage.trim(),
        media_url: mediaUrl,
        media_type: mediaType,
      });

      if (error) throw error;
      setNewMessage('');
      setMediaUrl(null);
      setMediaType(null);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleMediaSelected = (url: string, type: 'image' | 'video') => {
    setMediaUrl(url);
    setMediaType(type);
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
          {typingUsers.length > 0 && (
            <p className="text-xs text-muted-foreground animate-pulse">typing...</p>
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
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div className="flex flex-col gap-1 max-w-[70%]">
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      isOwn
                        ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white shadow-lg'
                        : 'bg-muted'
                    }`}
                  >
                    {message.content && <p className="break-words text-sm">{message.content}</p>}
                    {message.media_url && message.media_type && (
                      <div className="mt-2">
                        <MediaPreview 
                          mediaUrl={message.media_url} 
                          mediaType={message.media_type as 'image' | 'video'}
                          thumbnail={message.media_thumbnail}
                        />
                      </div>
                    )}
                  </div>
                  <span className={`text-xs px-2 ${isOwn ? 'text-right' : 'text-left'} ${isOwn ? 'text-white/70' : 'text-muted-foreground'}`}>
                    {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-border bg-card/50 backdrop-blur-sm">
        <div className="flex flex-col gap-2">
          {(mediaUrl && mediaType) && (
            <div className="p-2 border border-border rounded-lg bg-card/50">
              <MediaPreview mediaUrl={mediaUrl} mediaType={mediaType} />
            </div>
          )}
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={handleInputChange}
              placeholder="Type a message..."
              className="flex-1 bg-background/50"
              disabled={sending}
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={sending || (!newMessage.trim() && !mediaUrl)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <MediaUpload onMediaSelected={handleMediaSelected} disabled={sending} />
          </div>
        </div>
      </form>
    </Card>
  );
};

export default MatchChat;
