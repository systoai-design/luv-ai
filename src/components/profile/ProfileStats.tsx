import { Card } from "@/components/ui/card";

interface ProfileStatsProps {
  postsCount: number;
}

export const ProfileStats = ({ postsCount }: ProfileStatsProps) => {
  return (
    <Card className="p-4 bg-card border-border">
      <div className="flex justify-around">
        <div className="text-center">
          <div className="text-2xl font-bold text-foreground">{postsCount}</div>
          <div className="text-sm text-muted-foreground">Posts</div>
        </div>
      </div>
    </Card>
  );
};
