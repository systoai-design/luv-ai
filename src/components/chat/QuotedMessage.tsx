import { Reply } from 'lucide-react';

interface QuotedMessageProps {
  content?: string;
  mediaType?: 'image' | 'video' | 'audio';
  senderName?: string;
  isOwn?: boolean;
}

export const QuotedMessage = ({ content, mediaType, senderName, isOwn }: QuotedMessageProps) => {
  const displayContent = mediaType 
    ? `${mediaType === 'audio' ? '🎤' : mediaType === 'video' ? '🎥' : '📷'} ${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)}`
    : content;

  return (
    <div className="flex items-start gap-2 px-3 py-2 bg-muted/50 rounded-lg border-l-4 border-primary/50 mb-2">
      <Reply className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-primary mb-0.5">
          {isOwn ? 'You' : senderName || 'User'}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {displayContent || 'Message'}
        </p>
      </div>
    </div>
  );
};
