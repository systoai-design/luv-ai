import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ChatRequestCardProps {
  id: string;
  displayName: string;
  username: string;
  avatarUrl?: string;
  message?: string;
  createdAt: string;
  type: 'received' | 'sent';
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onCancel?: (id: string) => void;
  loading?: boolean;
}

export const ChatRequestCard = ({
  id,
  displayName,
  username,
  avatarUrl,
  message,
  createdAt,
  type,
  onAccept,
  onReject,
  onCancel,
  loading,
}: ChatRequestCardProps) => {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={avatarUrl} />
          <AvatarFallback>{displayName[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold">{displayName}</p>
              <p className="text-sm text-muted-foreground">@{username}</p>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
            </span>
          </div>
          
          {message && (
            <p className="mt-2 text-sm text-muted-foreground">{message}</p>
          )}
          
          {type === 'received' && (
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                onClick={() => onAccept?.(id)}
                disabled={loading}
              >
                <Check className="h-4 w-4 mr-1" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onReject?.(id)}
                disabled={loading}
              >
                <X className="h-4 w-4 mr-1" />
                Decline
              </Button>
            </div>
          )}
          
          {type === 'sent' && (
            <div className="mt-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onCancel?.(id)}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
