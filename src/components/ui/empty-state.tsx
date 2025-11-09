import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) => {
  return (
    <Card className={cn("border-border/50 shadow-card", className)} variant="glass">
      <CardContent className="flex flex-col items-center justify-center text-center p-12 space-y-6 animate-fade-in">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse" />
          <div className="relative p-6 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 animate-float">
            <Icon className="h-16 w-16 text-primary" strokeWidth={1.5} />
          </div>
        </div>

        <div className="space-y-2 max-w-md">
          <h3 className="text-2xl font-bold text-foreground">{title}</h3>
          <p className="text-muted-foreground text-base leading-relaxed">
            {description}
          </p>
        </div>

        {(action || secondaryAction) && (
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {action && (
              <Button
                size="lg"
                onClick={action.onClick}
                className="min-w-[140px]"
              >
                {action.label}
              </Button>
            )}
            {secondaryAction && (
              <Button
                size="lg"
                variant="outline"
                onClick={secondaryAction.onClick}
                className="min-w-[140px]"
              >
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
