import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import * as LucideIcons from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";

interface BadgeItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  badge_type: string;
  color: string;
  earned_at?: string;
}

interface ProfileBadgesProps {
  badges: BadgeItem[];
}

const BadgeIcon = ({ iconName }: { iconName: string }) => {
  const Icon = (LucideIcons as any)[iconName] || LucideIcons.Award;
  return <Icon className="h-5 w-5" />;
};

const getBadgeColor = (color: string) => {
  const colorMap: Record<string, string> = {
    purple: "bg-purple-500/20 text-purple-500 border-purple-500/50",
    blue: "bg-blue-500/20 text-blue-500 border-blue-500/50",
    green: "bg-green-500/20 text-green-500 border-green-500/50",
    gold: "bg-yellow-500/20 text-yellow-500 border-yellow-500/50",
    cyan: "bg-cyan-500/20 text-cyan-500 border-cyan-500/50",
    primary: "bg-primary/20 text-primary border-primary/50",
  };
  return colorMap[color] || colorMap.primary;
};

export const ProfileBadges = ({ badges }: ProfileBadgesProps) => {
  if (badges.length === 0) return null;

  return (
    <Card className="p-6 bg-card border-border">
      <h2 className="text-xl font-bold mb-4">
        Badges
        <Badge variant="secondary" className="ml-2 text-xs">
          {badges.length}
        </Badge>
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <TooltipProvider>
          {badges.map((badge) => (
            <Tooltip key={badge.id}>
              <TooltipTrigger asChild>
                <div
                  className={`
                    flex flex-col items-center gap-2 p-3 rounded-lg border-2 
                    ${getBadgeColor(badge.color)}
                    hover:scale-105 transition-transform cursor-help
                  `}
                >
                  <BadgeIcon iconName={badge.icon} />
                  <span className="text-xs font-medium text-center leading-tight">
                    {badge.name}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <div className="space-y-1">
                  <p className="font-semibold">{badge.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {badge.description}
                  </p>
                  {badge.earned_at && (
                    <p className="text-xs text-muted-foreground">
                      Earned {formatDistanceToNow(new Date(badge.earned_at), { addSuffix: true })}
                    </p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>
    </Card>
  );
};
