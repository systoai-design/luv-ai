import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2, X } from 'lucide-react';
import { MediaUpload } from './MediaUpload';
import { MediaPreview } from './MediaPreview';

interface ChatComposerProps {
  onSend: (payload: {
    text: string;
    mediaUrl?: string;
    mediaType?: 'image' | 'video';
    mediaThumbnail?: string;
  }) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
  isLoading?: boolean;
}

export const ChatComposer = ({ 
  onSend, 
  disabled, 
  placeholder = "Type a message...",
  isLoading = false
}: ChatComposerProps) => {
  const [text, setText] = useState('');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    if ((!text.trim() && !mediaUrl) || disabled || isLoading) return;
    
    await onSend({
      text: text.trim(),
      mediaUrl: mediaUrl || undefined,
      mediaType: mediaType || undefined,
    });

    setText('');
    setMediaUrl(null);
    setMediaType(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMediaSelected = (url: string, type: 'image' | 'video') => {
    setMediaUrl(url);
    setMediaType(type);
  };

  const clearMedia = () => {
    setMediaUrl(null);
    setMediaType(null);
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Media Preview */}
      {mediaUrl && mediaType && (
        <div className="relative p-2 border border-border rounded-lg bg-card/50">
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-1 right-1 h-6 w-6 z-10"
            onClick={clearMedia}
          >
            <X className="h-4 w-4" />
          </Button>
          <MediaPreview mediaUrl={mediaUrl} mediaType={mediaType} />
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="min-h-[60px] max-h-[200px] resize-none bg-background/50 rounded-2xl border-2 focus-visible:ring-primary/50"
            disabled={disabled || isLoading}
          />
        </div>
        <Button 
          onClick={handleSend} 
          disabled={disabled || isLoading || (!text.trim() && !mediaUrl)} 
          size="icon"
          className="h-[60px] w-[60px] rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 shadow-lg transition-all hover:scale-105"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Media Upload Controls */}
      <div className="flex items-center gap-2">
        <MediaUpload onMediaSelected={handleMediaSelected} disabled={disabled || isLoading} />
      </div>
    </div>
  );
};
