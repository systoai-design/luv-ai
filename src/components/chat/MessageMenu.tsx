import { MoreVertical, Smile, Reply, Forward, Trash2, EyeOff } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MessageMenuProps {
  messageId: string;
  isOwn: boolean;
  onReact: () => void;
  onReply: () => void;
  onForward: () => void;
  onDelete?: () => void;
  onDeleteForMe?: () => void;
  className?: string;
}

export const MessageMenu = ({
  messageId,
  isOwn,
  onReact,
  onReply,
  onForward,
  onDelete,
  onDeleteForMe,
  className,
}: MessageMenuProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-6 w-6 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background',
            'shadow-sm border border-border/50',
            className
          )}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={onReact}>
          <Smile className="mr-2 h-4 w-4" />
          React
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onReply}>
          <Reply className="mr-2 h-4 w-4" />
          Reply
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onForward}>
          <Forward className="mr-2 h-4 w-4" />
          Forward
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {isOwn ? (
          <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={onDeleteForMe}>
            <EyeOff className="mr-2 h-4 w-4" />
            Delete for Me
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
