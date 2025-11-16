import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, Video, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';

interface NotificationItemProps {
  notification: Notification;
}

export const NotificationItem = ({ notification }: NotificationItemProps) => {
  const navigate = useNavigate();
  const { markAsRead } = useNotifications();

  const getIcon = () => {
    switch (notification.type) {
      case 'match':
        return <Heart className="h-5 w-5 text-pink-500" />;
      case 'message':
        return <MessageCircle className="h-5 w-5 text-blue-500" />;
      case 'video_call':
        return <Video className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const handleClick = () => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.related_id) {
      switch (notification.type) {
        case 'match':
          navigate(`/matches`);
          break;
        case 'message':
          navigate(`/messages`);
          break;
        case 'video_call':
          navigate(`/messages`);
          break;
      }
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'p-4 cursor-pointer hover:bg-muted/50 transition-colors',
        !notification.read && 'bg-muted/20'
      )}
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0 mt-1">{getIcon()}</div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{notification.title}</p>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {notification.message}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatDistanceToNow(new Date(notification.created_at), {
              addSuffix: true,
            })}
          </p>
        </div>
        {!notification.read && (
          <div className="flex-shrink-0">
            <div className="h-2 w-2 rounded-full bg-primary" />
          </div>
        )}
      </div>
    </div>
  );
};
