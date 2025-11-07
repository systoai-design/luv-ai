import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Calendar, Sparkles } from 'lucide-react';

interface MatchInsightsProps {
  userId: string;
}

export const MatchInsights = ({ userId }: MatchInsightsProps) => {
  const [insights, setInsights] = useState<string[]>([]);
  const [topInterests, setTopInterests] = useState<{ interest: string; count: number }[]>([]);

  useEffect(() => {
    loadInsights();
  }, [userId]);

  const loadInsights = async () => {
    try {
      // Get matches
      const { data: matches } = await supabase
        .from('matches')
        .select('user_id_1, user_id_2')
        .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`);

      if (!matches || matches.length === 0) {
        setInsights(['Start swiping to get personalized insights!']);
        return;
      }

      const matchedUserIds = matches.map(m => 
        m.user_id_1 === userId ? m.user_id_2 : m.user_id_1
      );

      // Get matched users' profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('interests')
        .in('user_id', matchedUserIds);

      if (profiles && profiles.length > 0) {
        // Count interests
        const interestCounts: Record<string, number> = {};
        profiles.forEach(profile => {
          profile.interests?.forEach((interest: string) => {
            interestCounts[interest] = (interestCounts[interest] || 0) + 1;
          });
        });

        // Sort by count
        const sorted = Object.entries(interestCounts)
          .map(([interest, count]) => ({ interest, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 3);

        setTopInterests(sorted);

        // Generate insights
        const newInsights: string[] = [];
        
        if (sorted.length > 0) {
          const topInterest = sorted[0];
          const percentage = Math.round((topInterest.count / matches.length) * 100);
          newInsights.push(`${percentage}% of your matches love ${topInterest.interest}`);
        }

        if (matches.length >= 5) {
          newInsights.push(`You've made ${matches.length} connections! Keep it up!`);
        }

        if (sorted.length >= 2) {
          newInsights.push(`Your top match categories: ${sorted.slice(0, 2).map(s => s.interest).join(' & ')}`);
        }

        setInsights(newInsights);
      }
    } catch (error) {
      console.error('Error loading insights:', error);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Match Insights</h3>
      </div>

      <div className="space-y-3">
        {insights.map((insight, idx) => (
          <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">{insight}</p>
          </div>
        ))}
      </div>

      {topInterests.length > 0 && (
        <div className="pt-4 border-t">
          <p className="text-sm font-medium mb-3">Most Common Match Interests:</p>
          <div className="flex flex-wrap gap-2">
            {topInterests.map((item, idx) => (
              <Badge key={idx} variant="secondary" className="gap-1">
                {item.interest}
                <span className="text-xs opacity-70">({item.count})</span>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};