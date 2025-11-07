import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import * as LucideIcons from "lucide-react";
import { useAllBadges } from "@/hooks/useAllBadges";
import { formatDistanceToNow } from "date-fns";

const BadgeIcon = ({ iconName }: { iconName: string }) => {
  const Icon = (LucideIcons as any)[iconName] || LucideIcons.Award;
  return <Icon className="h-8 w-8" />;
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

const Badges = () => {
  const { badges, isLoading } = useAllBadges();

  if (isLoading) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  const earnedBadges = badges.filter((b) => b.earned);
  const unearnedBadges = badges.filter((b) => !b.earned);

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Badge Collection</h1>
        <p className="text-muted-foreground text-lg">
          Track your progress and unlock achievements
        </p>
        <div className="flex gap-4 mt-4">
          <Badge variant="secondary" className="text-sm">
            {earnedBadges.length} / {badges.length} Earned
          </Badge>
          <Badge variant="outline" className="text-sm">
            {Math.round((earnedBadges.length / badges.length) * 100)}% Complete
          </Badge>
        </div>
      </div>

      {earnedBadges.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Earned Badges</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {earnedBadges.map((badge) => (
              <Card key={badge.id} className="overflow-hidden border-2">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div
                      className={`
                        flex items-center justify-center p-3 rounded-lg border-2
                        ${getBadgeColor(badge.color)}
                      `}
                    >
                      <BadgeIcon iconName={badge.icon} />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {badge.name}
                        <Badge variant="secondary" className="text-xs">
                          Earned
                        </Badge>
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {badge.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Progress value={100} className="h-2" />
                    <p className="text-sm text-muted-foreground">
                      Earned{" "}
                      {badge.earned_at &&
                        formatDistanceToNow(new Date(badge.earned_at), {
                          addSuffix: true,
                        })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {unearnedBadges.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Available Badges</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {unearnedBadges.map((badge) => (
              <Card key={badge.id} className="overflow-hidden opacity-75 hover:opacity-100 transition-opacity">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div
                      className={`
                        flex items-center justify-center p-3 rounded-lg border-2 grayscale
                        ${getBadgeColor(badge.color)}
                      `}
                    >
                      <BadgeIcon iconName={badge.icon} />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {badge.name}
                        <Badge variant="outline" className="text-xs">
                          {Math.round(badge.progress)}%
                        </Badge>
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {badge.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Progress value={badge.progress} className="h-2" />
                    <p className="text-sm text-muted-foreground">
                      {badge.current} / {badge.target}{" "}
                      {badge.criteria.type === "posts_count" && "posts"}
                      {badge.criteria.type === "followers_count" && "followers"}
                      {badge.criteria.type === "verified_creator" && "verified"}
                      {badge.criteria.type === "profile_complete" && "completed"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Badges;
