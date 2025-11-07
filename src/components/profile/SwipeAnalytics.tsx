import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Heart, X, Users } from 'lucide-react';

interface SwipeAnalyticsProps {
  userId: string;
}

export const SwipeAnalytics = ({ userId }: SwipeAnalyticsProps) => {
  const [stats, setStats] = useState({
    totalLikes: 0,
    totalPasses: 0,
    totalMatches: 0,
    matchRate: 0,
  });

  useEffect(() => {
    loadStats();
  }, [userId]);

  const loadStats = async () => {
    try {
      // Get swipe counts
      const { data: swipes } = await supabase
        .from('swipes')
        .select('action')
        .eq('user_id', userId);

      const likes = swipes?.filter(s => s.action === 'like' || s.action === 'super_like').length || 0;
      const passes = swipes?.filter(s => s.action === 'pass').length || 0;

      // Get match count
      const { count: matchCount } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`);

      const matches = matchCount || 0;
      const rate = likes > 0 ? Math.round((matches / likes) * 100) : 0;

      setStats({
        totalLikes: likes,
        totalPasses: passes,
        totalMatches: matches,
        matchRate: rate,
      });
    } catch (error) {
      console.error('Error loading swipe stats:', error);
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Swipe Statistics</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-4 rounded-lg bg-muted/50">
          <Heart className="h-6 w-6 text-primary mx-auto mb-2" />
          <p className="text-2xl font-bold">{stats.totalLikes}</p>
          <p className="text-xs text-muted-foreground">Likes Sent</p>
        </div>

        <div className="text-center p-4 rounded-lg bg-muted/50">
          <X className="h-6 w-6 text-destructive mx-auto mb-2" />
          <p className="text-2xl font-bold">{stats.totalPasses}</p>
          <p className="text-xs text-muted-foreground">Passes</p>
        </div>

        <div className="text-center p-4 rounded-lg bg-muted/50">
          <Users className="h-6 w-6 text-primary mx-auto mb-2" />
          <p className="text-2xl font-bold">{stats.totalMatches}</p>
          <p className="text-xs text-muted-foreground">Matches</p>
        </div>

        <div className="text-center p-4 rounded-lg bg-primary/10">
          <TrendingUp className="h-6 w-6 text-primary mx-auto mb-2" />
          <p className="text-2xl font-bold">{stats.matchRate}%</p>
          <p className="text-xs text-muted-foreground">Match Rate</p>
        </div>
      </div>

      {stats.totalLikes > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Success Rate</span>
            <span className="font-semibold">{stats.matchRate}%</span>
          </div>
          <Progress value={stats.matchRate} className="h-2" />
        </div>
      )}
    </Card>
  );
};