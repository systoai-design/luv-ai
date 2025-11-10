import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/hooks/useChat';
import { useCompanionAccess } from '@/hooks/useCompanionAccess';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PurchaseAccessDialog } from '@/components/PurchaseAccessDialog';
import { ChatLimitBadge } from '@/components/chat/ChatLimitBadge';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletAuthModal } from '@/components/auth/WalletAuthModal';
import { ChatComposer } from '@/components/chat/ChatComposer';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { toast as sonnerToast } from 'sonner';

const Chat = () => {
  const { companionId } = useParams<{ companionId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { connected } = useWallet();
  const [chatId, setChatId] = useState<string | null>(null);
  const [companion, setCompanion] = useState<any>(null);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [localMessages, setLocalMessages] = useState<any[]>([]);
  const [replyToMessage, setReplyToMessage] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, isLoading, sendMessage, loadMessages } = useChat(chatId || '', companionId || '');
  const { hasAccess, isLoading: isCheckingAccess, accessPrice, grantAccess } = useCompanionAccess(companionId);

  useEffect(() => {
    setLocalMessages(messages);
  }, [messages]);

  useEffect(() => {
    if (!user || !companionId) {
      navigate('/');
      return;
    }

    const initChat = async () => {
      try {
        // Get companion details
        const { data: companionData, error: companionError } = await (supabase as any)
          .from('ai_companions')
          .select('*')
          .eq('id', companionId)
          .single();

        if (companionError) throw companionError;
        if (!companionData) {
          toast({
            title: "Error",
            description: "Companion not found",
            variant: "destructive",
          });
          navigate('/');
          return;
        }

        setCompanion(companionData);

        // Get or create chat
        const { data: existingChat } = await (supabase as any)
          .from('user_chats')
          .select('id')
          .eq('user_id', user.id)
          .eq('companion_id', companionId)
          .maybeSingle();

        if (existingChat) {
          setChatId(existingChat.id);
        } else {
          const { data: newChat, error: createError } = await (supabase as any)
            .from('user_chats')
            .insert({
              user_id: user.id,
              companion_id: companionId,
            })
            .select('id')
            .single();

          if (createError) throw createError;
          if (!newChat) {
            toast({
              title: "Error",
              description: "Failed to create chat",
              variant: "destructive",
            });
            navigate('/');
            return;
          }

          setChatId(newChat.id);
        }
      } catch (error) {
        console.error('Error initializing chat:', error);
        toast({
          title: "Error",
          description: "Failed to initialize chat",
          variant: "destructive",
        });
        navigate('/');
      }
    };

    initChat();
  }, [user, companionId, navigate, toast]);

  useEffect(() => {
    if (chatId && hasAccess) {
      loadMessages();
    }
  }, [chatId, hasAccess, loadMessages]);

  // Handle ?purchase=1 query param
  useEffect(() => {
    if (searchParams.get('purchase') === '1' && companion && !hasAccess) {
      if (!connected) {
        setShowWalletModal(true);
      } else {
        setShowPurchaseDialog(true);
      }
    }
  }, [searchParams, companion, hasAccess, connected]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (payload: { 
    text: string; 
    mediaUrl?: string; 
    mediaType?: 'image' | 'video' | 'audio';
    audioDuration?: number;
    replyToMessageId?: string;
  }) => {
    await sendMessage(payload.text, payload.mediaUrl || null, payload.mediaType || null, payload.audioDuration, payload.replyToMessageId);
    setReplyToMessage(null);
  };

  const handleReplyToMessage = (messageId: string) => {
    const message = localMessages.find(msg => msg.id === messageId);
    if (message) {
      setReplyToMessage(message);
    }
  };

  const handleReact = async (messageId: string, emoji: string) => {
    if (!user) return;

    try {
      // Check if user already reacted with this emoji
      const { data: existing } = await supabase
        .from('chat_message_reactions')
        .select('id')
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .eq('emoji', emoji)
        .maybeSingle();

      if (existing) {
        // Remove reaction
        await supabase
          .from('chat_message_reactions')
          .delete()
          .eq('id', existing.id);
      } else {
        // Add reaction
        await supabase
          .from('chat_message_reactions')
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
      sonnerToast.error('Failed to react to message');
    }
  };

  const handleAudioListened = async (messageId: string) => {
    try {
      await supabase
        .from('chat_messages')
        .update({ listened: true })
        .eq('id', messageId);
    } catch (error) {
      console.error('Error marking audio as listened:', error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      // Optimistic update
      setLocalMessages((prev) => prev.filter((msg) => msg.id !== messageId));

      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
      
      sonnerToast.success('Message deleted');
    } catch (error) {
      console.error('Error deleting message:', error);
      sonnerToast.error('Failed to delete message');
      // Reload messages on error
      loadMessages();
    }
  };

  if (!companion || !chatId || isCheckingAccess) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <>
        <div className="container mx-auto px-4 py-12 max-w-2xl">
          <div className="text-center space-y-6">
            <Avatar className="h-32 w-32 mx-auto">
              <AvatarImage src={companion.avatar_url} alt={companion.name} />
              <AvatarFallback>{companion.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold mb-2">{companion.name}</h1>
              <p className="text-muted-foreground">{companion.tagline}</p>
            </div>
            <div className="bg-card rounded-lg p-6 space-y-4 border border-border">
              <p className="text-sm text-muted-foreground">
                Purchase one-time access to chat with {companion.name}
              </p>
              <div className="text-4xl font-bold">{accessPrice} SOL</div>
              <Button 
                onClick={() => connected ? setShowPurchaseDialog(true) : setShowWalletModal(true)} 
                size="lg" 
                className="w-full"
              >
                {connected ? 'Purchase Access' : 'Connect Wallet to Purchase'}
              </Button>
            </div>
            <Button variant="ghost" onClick={() => navigate('/marketplace')}>
              Back to Marketplace
            </Button>
          </div>
        </div>
        <PurchaseAccessDialog
          open={showPurchaseDialog}
          onOpenChange={setShowPurchaseDialog}
          companion={{
            id: companionId!,
            name: companion.name,
            avatar_url: companion.avatar_url,
            access_price: accessPrice,
          }}
          onSuccess={() => window.location.reload()}
          onGrantAccess={grantAccess}
        />
        <WalletAuthModal
          open={showWalletModal}
          onOpenChange={setShowWalletModal}
          onSuccess={() => {
            setShowWalletModal(false);
            setShowPurchaseDialog(true);
          }}
        />
      </>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] lg:pl-64 xl:pr-80">
      {/* Header */}
      <div className="border-b border-border bg-card/50 p-4 flex items-center gap-4">
        <Avatar className="h-10 w-10">
          <AvatarImage src={companion.avatar_url} alt={companion.name} />
          <AvatarFallback>{companion.name[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="font-semibold text-foreground">{companion.name}</h1>
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">AI Companion</p>
            <CheckCircle className="h-3 w-3 text-primary" />
            <span className="text-xs text-primary">Lifetime Access</span>
          </div>
        </div>
        <ChatLimitBadge />
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6 max-w-3xl mx-auto">
          {localMessages.map((message) => {
            const isOwn = message.sender_type === 'user';
            const quotedMsg = message.quoted_message ? {
              content: message.quoted_message.content,
              mediaType: message.quoted_message.media_type as 'image' | 'video' | 'audio' | undefined,
              senderName: message.quoted_message.sender_type === 'user' ? 'You' : companion.name,
              isOwn: message.quoted_message.sender_type === 'user',
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
                senderAvatar={companion.avatar_url}
                senderName={companion.name}
                showAvatar={message.sender_type === 'companion'}
                reactions={message.reactions || []}
                quotedMessage={quotedMsg}
              />
            );
          })}
          {isLoading && (
            <div className="flex gap-3 justify-start animate-fade-in">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={companion.avatar_url} alt={companion.name} />
                <AvatarFallback>{companion.name[0]}</AvatarFallback>
              </Avatar>
              <div className="rounded-2xl px-4 py-3 bg-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-border bg-card/50 backdrop-blur-sm p-4">
        <div className="max-w-3xl mx-auto">
          <ChatComposer
            onSend={handleSend}
            placeholder={`Message ${companion.name}...`}
            disabled={false}
            isLoading={isLoading}
            replyToMessage={replyToMessage ? {
              id: replyToMessage.id,
              content: replyToMessage.content,
              mediaType: replyToMessage.media_type,
              senderName: replyToMessage.sender_type === 'user' ? 'You' : companion.name,
              isOwn: replyToMessage.sender_type === 'user',
            } : null}
            onCancelReply={() => setReplyToMessage(null)}
          />
        </div>
      </div>
    </div>
  );
};

export default Chat;
