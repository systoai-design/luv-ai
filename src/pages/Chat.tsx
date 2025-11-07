import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

const Chat = () => {
  const { companionId } = useParams<{ companionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [chatId, setChatId] = useState<string | null>(null);
  const [companion, setCompanion] = useState<any>(null);
  const [input, setInput] = useState('');
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
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

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const message = input;
    setInput('');
    await sendMessage(message);
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
              <Button onClick={() => setShowPurchaseDialog(true)} size="lg" className="w-full">
                Purchase Access
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
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 max-w-3xl mx-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.sender_type === 'companion' && (
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={companion.avatar_url} alt={companion.name} />
                  <AvatarFallback>{companion.name[0]}</AvatarFallback>
                </Avatar>
              )}
              <div
                className={`rounded-lg px-4 py-2 max-w-[70%] ${
                  message.sender_type === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={companion.avatar_url} alt={companion.name} />
                <AvatarFallback>{companion.name[0]}</AvatarFallback>
              </Avatar>
              <div className="rounded-lg px-4 py-2 bg-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-border bg-card/50 p-4">
        <div className="max-w-3xl mx-auto flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${companion.name}...`}
            className="min-h-[60px] resize-none"
            disabled={isLoading}
          />
          <Button onClick={handleSend} disabled={isLoading || !input.trim()} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
