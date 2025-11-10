import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Search, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Chat {
  id: string;
  name: string;
  avatarUrl?: string;
  type: 'match' | 'companion';
}

interface ForwardMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messageContent: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio';
  onForward: (chatIds: string[]) => void;
}

export const ForwardMessageDialog = ({
  open,
  onOpenChange,
  messageContent,
  mediaUrl,
  mediaType,
  onForward,
}: ForwardMessageDialogProps) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatIds, setSelectedChatIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadChats();
    }
  }, [open]);

  const loadChats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load matches
      const { data: matches } = await supabase
        .from('matches')
        .select(`
          id,
          user_id_1,
          user_id_2,
          profiles!matches_user_id_1_fkey(display_name, avatar_url),
          profiles!matches_user_id_2_fkey(display_name, avatar_url)
        `)
        .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`);

      // Load AI companion chats
      const { data: companionChats } = await supabase
        .from('user_chats')
        .select(`
          id,
          companion_id,
          ai_companions(name, avatar_url)
        `)
        .eq('user_id', user.id);

      const chatList: Chat[] = [];

      // Process matches
      matches?.forEach((match: any) => {
        const otherUserId = match.user_id_1 === user.id ? match.user_id_2 : match.user_id_1;
        const profile = match.user_id_1 === user.id ? match.profiles : match.profiles;
        
        chatList.push({
          id: match.id,
          name: profile?.display_name || 'Unknown User',
          avatarUrl: profile?.avatar_url,
          type: 'match',
        });
      });

      // Process companion chats
      companionChats?.forEach((chat: any) => {
        chatList.push({
          id: chat.id,
          name: chat.ai_companions?.name || 'AI Companion',
          avatarUrl: chat.ai_companions?.avatar_url,
          type: 'companion',
        });
      });

      setChats(chatList);
    } catch (error) {
      console.error('Error loading chats:', error);
      toast.error('Failed to load chats');
    }
  };

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleChatSelection = (chatId: string) => {
    setSelectedChatIds(prev =>
      prev.includes(chatId)
        ? prev.filter(id => id !== chatId)
        : [...prev, chatId]
    );
  };

  const handleForward = async () => {
    if (selectedChatIds.length === 0) {
      toast.error('Please select at least one chat');
      return;
    }

    setLoading(true);
    try {
      await onForward(selectedChatIds);
      toast.success(`Message forwarded to ${selectedChatIds.length} chat(s)`);
      onOpenChange(false);
      setSelectedChatIds([]);
      setSearchQuery('');
    } catch (error) {
      console.error('Error forwarding message:', error);
      toast.error('Failed to forward message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Forward Message</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Message Preview */}
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {messageContent}
            </p>
            {mediaUrl && (
              <p className="text-xs text-muted-foreground mt-1">
                + {mediaType === 'image' ? 'Photo' : mediaType === 'video' ? 'Video' : 'Audio'}
              </p>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Chat List */}
          <ScrollArea className="h-[300px] border rounded-lg">
            {filteredChats.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p className="text-sm">No chats available</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredChats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => toggleChatSelection(chat.id)}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors',
                      'hover:bg-accent',
                      selectedChatIds.includes(chat.id) && 'bg-accent'
                    )}
                  >
                    <Checkbox
                      checked={selectedChatIds.includes(chat.id)}
                      onCheckedChange={() => toggleChatSelection(chat.id)}
                    />
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={chat.avatarUrl} />
                      <AvatarFallback>{chat.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{chat.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {chat.type === 'match' ? 'Match' : 'AI Companion'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleForward} disabled={loading || selectedChatIds.length === 0}>
            <Send className="mr-2 h-4 w-4" />
            Forward {selectedChatIds.length > 0 && `(${selectedChatIds.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
