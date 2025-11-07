import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BarChart3 } from 'lucide-react';

interface InterestPopularityProps {
  userId: string;
}

export const InterestPopularity = ({ userId }: InterestPopularityProps) => {
  const [popularInterests, setPopularInterests] = useState<{ name: string; percentage: number }[]>([]);

  useEffect(() => {
    loadPopularity();
  }, [userId]);

  const loadPopularity = async () => {
    try {
      // Get user's interests
      const { data: profile } = await supabase
        .from('profiles')
        .select('interests')
        .eq('user_id', userId)
        .single();

      if (!profile?.interests || profile.interests.length === 0) return;

      // Get matches
      const { data: matches } = await supabase
        .from('matches')
        .select('user_id_1, user_id_2')
        .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`);

      if (!matches || matches.length === 0) return;

      const matchedUserIds = matches.map(m => 
        m.user_id_1 === userId ? m.user_id_2 : m.user_id_1
      );

      // Get matched users' profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('interests')
        .in('user_id', matchedUserIds);

      if (profiles) {
        // Count how many matches share each interest
        const interestCounts: Record<string, number> = {};
        profile.interests.forEach(interest => {
          interestCounts[interest] = 0;
        });

        profiles.forEach(p => {
          p.interests?.forEach((interest: string) => {
            if (interestCounts[interest] !== undefined) {
              interestCounts[interest]++;
            }
          });
        });

        // Calculate percentages
        const popular = Object.entries(interestCounts)
          .map(([name, count]) => ({
            name,
            percentage: Math.round((count / matches.length) * 100),
          }))
          .sort((a, b) => b.percentage - a.percentage)
          .slice(0, 5);

        setPopularInterests(popular);
      }
    } catch (error) {
      console.error('Error loading interest popularity:', error);
    }
  };

  if (popularInterests.length === 0) return null;

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Interest Popularity</h3>
      </div>

      <p className="text-sm text-muted-foreground">
        How often your interests appear in your matches:
      </p>

      <div className="space-y-4">
        {popularInterests.map((item, idx) => (
          <div key={idx} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{item.name}</span>
              <span className="text-muted-foreground">{item.percentage}%</span>
            </div>
            <Progress value={item.percentage} className="h-2" />
          </div>
        ))}
      </div>
    </Card>
  );
};