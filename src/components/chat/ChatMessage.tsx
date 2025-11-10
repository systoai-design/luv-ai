import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { MediaPreview } from './MediaPreview';
import { AudioPlayer } from './AudioPlayer';
import { MessageStatusIndicator } from './MessageStatusIndicator';
import { QuotedMessage } from './QuotedMessage';
import { MessageReactions } from './MessageReactions';
import { ReactionPicker } from './ReactionPicker';
import { formatDistanceToNow } from 'date-fns';
import { Trash2, Reply } from 'lucide-react';
import { useSwipeToDelete } from '@/hooks/useSwipeToDelete';
import { useLongPress } from '@/hooks/useLongPress';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState, useRef } from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

interface Reaction {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

interface ChatMessageProps {
  isOwn: boolean;
  content?: string;
  createdAt: string;
  read?: boolean;
  listened?: boolean;
  messageId?: string;
  onMarkListened?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onReply?: (messageId: string) => void;
  onReact?: (messageId: string, emoji: string) => void;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio';
  mediaThumbnail?: string;
  audioDuration?: number;
  senderAvatar?: string;
  senderName?: string;
  showAvatar?: boolean;
  reactions?: Reaction[];
  quotedMessage?: {
    content?: string;
    mediaType?: 'image' | 'video' | 'audio';
    senderName?: string;
    isOwn?: boolean;
  };
}

export const ChatMessage = ({
  isOwn,
  content,
  createdAt,
  read,
  listened,
  messageId,
  onMarkListened,
  onDelete,
  onReply,
  onReact,
  mediaUrl,
  mediaType,
  mediaThumbnail,
  audioDuration,
  senderAvatar,
  senderName,
  showAvatar = true,
  reactions = [],
  quotedMessage,
}: ChatMessageProps) => {
  const isMobile = useIsMobile();
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [pickerPosition, setPickerPosition] = useState({ x: 0, y: 0 });
  const messageRef = useRef<HTMLDivElement>(null);

  const handleDelete = () => {
    if (messageId && onDelete) {
      onDelete(messageId);
    }
  };

  const handleReply = () => {
    if (messageId && onReply) {
      onReply(messageId);
    }
  };

  const handleShowReactionPicker = () => {
    if (messageRef.current) {
      const rect = messageRef.current.getBoundingClientRect();
      setPickerPosition({
        x: rect.left + rect.width / 2,
        y: rect.top,
      });
      setShowReactionPicker(true);
    }
  };

  const handleReaction = (emoji: string) => {
    if (messageId && onReact) {
      onReact(messageId, emoji);
    }
    setShowReactionPicker(false);
  };

  const handleReactionClick = (emoji: string) => {
    if (messageId && onReact) {
      onReact(messageId, emoji);
    }
  };

  const longPressHandlers = useLongPress({
    onLongPress: handleShowReactionPicker,
    onClick: isMobile ? handleReply : undefined,
    delay: 500,
  });

  const { swipeX, handlers } = useSwipeToDelete({
    onDelete: handleDelete,
    threshold: 100,
  });

  const messageContent = (
    <div
      className={`flex gap-3 ${isOwn ? 'justify-end' : 'justify-start'} animate-fade-in`}
    >
      {!isOwn && showAvatar && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={senderAvatar} alt={senderName || 'User'} />
          <AvatarFallback>{senderName?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
        </Avatar>
      )}
      <div 
        ref={messageRef}
        className="flex flex-col gap-1 max-w-[70%] relative"
        style={isMobile && isOwn ? {
          transform: `translateX(${swipeX}px)`,
          transition: swipeX === 0 ? 'transform 0.3s ease-out' : 'none',
        } : undefined}
        {...(isMobile && isOwn ? handlers : {})}
        {...longPressHandlers}
      >
        <div
          className={`rounded-2xl px-4 py-3 ${
            isOwn
              ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white shadow-lg'
              : 'bg-muted text-foreground'
          }`}
        >
          {quotedMessage && (
            <QuotedMessage 
              content={quotedMessage.content}
              mediaType={quotedMessage.mediaType}
              senderName={quotedMessage.senderName}
              isOwn={quotedMessage.isOwn}
            />
          )}
          {content && (
            <p className="text-sm whitespace-pre-wrap break-words">
              {content}
            </p>
          )}
          {mediaUrl && mediaType && (
            <div className={content ? 'mt-2' : ''}>
              {mediaType === 'audio' ? (
                <AudioPlayer 
                  audioUrl={mediaUrl} 
                  duration={audioDuration}
                  messageId={messageId}
                  onPlaybackStarted={onMarkListened}
                  hasBeenListened={listened}
                />
              ) : (
                <MediaPreview 
                  mediaUrl={mediaUrl} 
                  mediaType={mediaType}
                  thumbnail={mediaThumbnail}
                />
              )}
            </div>
          )}
        </div>
        <div className={`flex items-center gap-1.5 px-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
          </span>
          <MessageStatusIndicator 
            read={read || false} 
            listened={listened || false}
            mediaType={mediaType}
            isOwn={isOwn}
          />
        </div>

        <MessageReactions
          reactions={reactions}
          onReactionClick={handleReactionClick}
          isOwn={isOwn}
        />
        
        {/* Delete indicator for swipe */}
        {isMobile && isOwn && swipeX < -20 && (
          <div 
            className="absolute right-0 top-0 bottom-0 w-16 flex items-center justify-center bg-destructive rounded-r-2xl"
            style={{
              transform: `translateX(${Math.abs(swipeX)}px)`,
            }}
          >
            <Trash2 className="h-5 w-5 text-destructive-foreground" />
          </div>
        )}
      </div>
      
      <ReactionPicker
        isOpen={showReactionPicker}
        onSelect={handleReaction}
        position={pickerPosition}
      />
    </div>
  );

  // Desktop: Wrap with context menu
  if (!isMobile && messageId && (onDelete || onReply)) {
    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          {messageContent}
        </ContextMenuTrigger>
        <ContextMenuContent>
          {onReply && (
            <ContextMenuItem onClick={handleReply}>
              <Reply className="h-4 w-4 mr-2" />
              Reply
            </ContextMenuItem>
          )}
          {isOwn && onDelete && (
            <ContextMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Message
            </ContextMenuItem>
          )}
        </ContextMenuContent>
      </ContextMenu>
    );
  }

  return messageContent;
};
