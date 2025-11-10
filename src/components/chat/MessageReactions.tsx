import { cn } from '@/lib/utils';

interface Reaction {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

interface MessageReactionsProps {
  reactions: Reaction[];
  onReactionClick: (emoji: string) => void;
  isOwn: boolean;
}

export const MessageReactions = ({
  reactions,
  onReactionClick,
  isOwn,
}: MessageReactionsProps) => {
  if (reactions.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap gap-1 mt-1', isOwn ? 'justify-end' : 'justify-start')}>
      {reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          onClick={() => onReactionClick(reaction.emoji)}
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all',
            reaction.hasReacted
              ? 'bg-primary/20 border border-primary'
              : 'bg-muted border border-border hover:bg-muted/80'
          )}
        >
          <span>{reaction.emoji}</span>
          <span className="text-muted-foreground">{reaction.count}</span>
        </button>
      ))}
    </div>
  );
};
