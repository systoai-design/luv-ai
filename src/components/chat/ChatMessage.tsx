import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { MediaPreview } from './MediaPreview';
import { AudioPlayer } from './AudioPlayer';
import { MessageStatusIndicator } from './MessageStatusIndicator';
import { QuotedMessage } from './QuotedMessage';
import { MessageReactions } from './MessageReactions';
import { ReactionPicker } from './ReactionPicker';
import { MessageMenu } from './MessageMenu';
import { formatDistanceToNow } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState, useRef } from 'react';

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
  onDeleteForMe?: (messageId: string) => void;
  onReply?: (messageId: string) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onForward?: (messageId: string) => void;
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
  onDeleteForMe,
  onReply,
  onReact,
  onForward,
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
  const [isHovered, setIsHovered] = useState(false);
  const messageRef = useRef<HTMLDivElement>(null);

  const handleDelete = () => {
    if (messageId && onDelete) {
      onDelete(messageId);
    }
  };

  const handleDeleteForMe = () => {
    if (messageId && onDeleteForMe) {
      onDeleteForMe(messageId);
    }
  };

  const handleReply = () => {
    if (messageId && onReply) {
      onReply(messageId);
    }
  };

  const handleForward = () => {
    if (messageId && onForward) {
      onForward(messageId);
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

  return (
    <div
      className={`flex gap-3 ${isOwn ? 'justify-end' : 'justify-start'} animate-fade-in group`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
      >
        <div className="relative">
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

          {/* Message Menu */}
          {messageId && (
            <MessageMenu
              messageId={messageId}
              isOwn={isOwn}
              onReact={handleShowReactionPicker}
              onReply={handleReply}
              onForward={handleForward}
              onDelete={handleDelete}
              onDeleteForMe={handleDeleteForMe}
              className={`absolute -top-2 ${isOwn ? '-left-8' : '-right-8'} ${
                isMobile ? 'opacity-100' : isHovered ? 'opacity-100' : 'opacity-0'
              } transition-opacity`}
            />
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
      </div>
      
      <ReactionPicker
        isOpen={showReactionPicker}
        onSelect={handleReaction}
        position={pickerPosition}
      />
    </div>
  );
};
