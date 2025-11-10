import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { MediaPreview } from './MediaPreview';
import { AudioPlayer } from './AudioPlayer';
import { MessageStatusIndicator } from './MessageStatusIndicator';
import { formatDistanceToNow } from 'date-fns';

interface ChatMessageProps {
  isOwn: boolean;
  content?: string;
  createdAt: string;
  read?: boolean;
  listened?: boolean;
  messageId?: string;
  onMarkListened?: (messageId: string) => void;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio';
  mediaThumbnail?: string;
  audioDuration?: number;
  senderAvatar?: string;
  senderName?: string;
  showAvatar?: boolean;
}

export const ChatMessage = ({
  isOwn,
  content,
  createdAt,
  read,
  listened,
  messageId,
  onMarkListened,
  mediaUrl,
  mediaType,
  mediaThumbnail,
  audioDuration,
  senderAvatar,
  senderName,
  showAvatar = true,
}: ChatMessageProps) => {
  return (
    <div
      className={`flex gap-3 ${isOwn ? 'justify-end' : 'justify-start'} animate-fade-in`}
    >
      {!isOwn && showAvatar && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={senderAvatar} alt={senderName || 'User'} />
          <AvatarFallback>{senderName?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
        </Avatar>
      )}
      <div className="flex flex-col gap-1 max-w-[70%]">
        <div
          className={`rounded-2xl px-4 py-3 ${
            isOwn
              ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white shadow-lg'
              : 'bg-muted text-foreground'
          }`}
        >
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
      </div>
    </div>
  );
};
