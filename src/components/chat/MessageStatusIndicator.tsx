import { Check, CheckCheck, Volume2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MessageStatusIndicatorProps {
  read: boolean;
  listened?: boolean;
  mediaType?: 'image' | 'video' | 'audio';
  isOwn: boolean;
}

export const MessageStatusIndicator = ({ 
  read, 
  listened, 
  mediaType, 
  isOwn 
}: MessageStatusIndicatorProps) => {
  if (!isOwn) return null; // Only show for sent messages
  
  // Delivered (not read yet)
  if (!read) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Check className="h-3 w-3 text-muted-foreground transition-colors" />
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Delivered</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  // Audio message that's been listened to
  if (mediaType === 'audio' && listened) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <div className="flex items-center gap-0.5 animate-fade-in">
              <Volume2 className="h-3 w-3 text-blue-500" />
              <CheckCheck className="h-3 w-3 text-blue-500" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Listened</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  // Read (text/image/video or audio not yet listened)
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <CheckCheck className="h-3 w-3 text-blue-500 animate-fade-in transition-colors" />
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">Read</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
