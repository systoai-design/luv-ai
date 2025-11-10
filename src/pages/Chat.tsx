import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/hooks/useChat';
import { useCompanionAccess } from '@/hooks/useCompanionAccess';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Send, Loader2, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PurchaseAccessDialog } from '@/components/PurchaseAccessDialog';
import { ChatLimitBadge } from '@/components/chat/ChatLimitBadge';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletAuthModal } from '@/components/auth/WalletAuthModal';
import { MediaUpload } from '@/components/chat/MediaUpload';
import { MediaPreview } from '@/components/chat/MediaPreview';
import { formatDistanceToNow } from 'date-fns';

const Chat = () => {
  const { companionId } = useParams<{ companionId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { connected } = useWallet();
  const [chatId, setChatId] = useState<string | null>(null);
  const [companion, setCompanion] = useState<any>(null);
  const [input, setInput] = useState('');
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, isLoading, sendMessage, loadMessages } = useChat(chatId || '', companionId || '');
  const { hasAccess, isLoading: isCheckingAccess, accessPrice, grantAccess } = useCompanionAccess(companionId);

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

  const handleSend = async () => {
    if ((!input.trim() && !mediaUrl) || isLoading) return;
    const message = input;
    const media = mediaUrl;
    const type = mediaType;
    setInput('');
    setMediaUrl(null);
    setMediaType(null);
    await sendMessage(message, media, type);
  };

  const handleMediaSelected = (url: string, type: 'image' | 'video') => {
    setMediaUrl(url);
    setMediaType(type);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.sender_type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              {message.sender_type === 'companion' && (
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={companion.avatar_url} alt={companion.name} />
                  <AvatarFallback>{companion.name[0]}</AvatarFallback>
                </Avatar>
              )}
              <div className="flex flex-col gap-1 max-w-[70%]">
                <div
                  className={`rounded-2xl px-4 py-3 ${
                    message.sender_type === 'user'
                      ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white shadow-lg'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  {message.content && <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>}
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
                <span className={`text-xs px-2 ${message.sender_type === 'user' ? 'text-right' : 'text-left'} text-muted-foreground`}>
                  {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          ))}
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
          <div className="flex flex-col gap-2">
            <div className="flex items-end gap-2">
              <div className="flex-1 flex flex-col gap-2">
                {(mediaUrl && mediaType) && (
                  <div className="p-2 border border-border rounded-lg bg-card/50">
                    <MediaPreview mediaUrl={mediaUrl} mediaType={mediaType} />
                  </div>
                )}
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Message ${companion.name}...`}
                  className="min-h-[60px] resize-none bg-background/50"
                  disabled={isLoading}
                />
              </div>
              <Button 
                onClick={handleSend} 
                disabled={isLoading || (!input.trim() && !mediaUrl)} 
                size="icon"
                className="h-[60px] w-[60px] bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <MediaUpload onMediaSelected={handleMediaSelected} disabled={isLoading} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
