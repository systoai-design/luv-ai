import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Heart, Check } from 'lucide-react';

interface MutualConnectionsProps {
  currentUserId: string;
  viewedUserId: string;
  viewedUserInterests?: string[];
}

export const MutualConnections = ({ 
  currentUserId, 
  viewedUserId, 
  viewedUserInterests 
}: MutualConnectionsProps) => {
  const [sharedInterests, setSharedInterests] = useState<string[]>([]);
  const [mutualFollowers, setMutualFollowers] = useState<any[]>([]);
  const [mutualMatches, setMutualMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConnections();
  }, [currentUserId, viewedUserId]);

  const loadConnections = async () => {
    try {
      // Get current user's profile
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('interests')
        .eq('user_id', currentUserId)
        .single();

      // Calculate shared interests
      if (currentProfile?.interests && viewedUserInterests) {
        const shared = currentProfile.interests.filter((interest: string) =>
          viewedUserInterests.some(vi => vi.toLowerCase() === interest.toLowerCase())
        );
        setSharedInterests(shared);
      }

      // Get mutual followers
      const { data: currentFollowing } = await supabase
        .from('followers')
        .select('following_id')
        .eq('follower_id', currentUserId);

      const { data: viewedFollowing } = await supabase
        .from('followers')
        .select('following_id')
        .eq('follower_id', viewedUserId);

      if (currentFollowing && viewedFollowing) {
        const currentIds = currentFollowing.map(f => f.following_id);
        const viewedIds = viewedFollowing.map(f => f.following_id);
        const mutualIds = currentIds.filter(id => viewedIds.includes(id));

        if (mutualIds.length > 0) {
          const { data: mutualProfiles } = await supabase
            .from('profiles')
            .select('user_id, display_name, avatar_url')
            .in('user_id', mutualIds.slice(0, 5));

          setMutualFollowers(mutualProfiles || []);
        }
      }

      // Get mutual matches (people both users have matched with)
      const { data: currentMatches } = await supabase
        .from('matches')
        .select('user_id_1, user_id_2')
        .or(`user_id_1.eq.${currentUserId},user_id_2.eq.${currentUserId}`);

      const { data: viewedMatches } = await supabase
        .from('matches')
        .select('user_id_1, user_id_2')
        .or(`user_id_1.eq.${viewedUserId},user_id_2.eq.${viewedUserId}`);

      if (currentMatches && viewedMatches) {
        const currentMatchIds = currentMatches.map(m => 
          m.user_id_1 === currentUserId ? m.user_id_2 : m.user_id_1
        );
        const viewedMatchIds = viewedMatches.map(m => 
          m.user_id_1 === viewedUserId ? m.user_id_2 : m.user_id_1
        );
        const mutualMatchIds = currentMatchIds.filter(id => viewedMatchIds.includes(id));

        if (mutualMatchIds.length > 0) {
          const { data: mutualMatchProfiles } = await supabase
            .from('profiles')
            .select('user_id, display_name, avatar_url')
            .in('user_id', mutualMatchIds.slice(0, 5));

          setMutualMatches(mutualMatchProfiles || []);
        }
      }
    } catch (error) {
      console.error('Error loading mutual connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalConnections = mutualFollowers.length + mutualMatches.length;

  if (loading || (sharedInterests.length === 0 && totalConnections === 0)) {
    return null;
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Mutual Connections</h3>
      </div>

      {sharedInterests.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Shared Interests ({sharedInterests.length}):
          </p>
          <div className="flex flex-wrap gap-2">
            {sharedInterests.map((interest, idx) => (
              <Badge 
                key={idx} 
                className="bg-primary/20 text-primary border-primary"
              >
                <Check className="h-3 w-3 mr-1" />
                {interest}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {mutualFollowers.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Mutual Followers ({mutualFollowers.length}):
          </p>
          <div className="flex -space-x-2">
            {mutualFollowers.slice(0, 5).map((profile) => (
              <Avatar key={profile.user_id} className="border-2 border-background">
                <AvatarImage src={profile.avatar_url || ''} />
                <AvatarFallback>
                  {profile.display_name?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            ))}
            {mutualFollowers.length > 5 && (
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted border-2 border-background text-xs font-medium">
                +{mutualFollowers.length - 5}
              </div>
            )}
          </div>
        </div>
      )}

      {mutualMatches.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Mutual Matches ({mutualMatches.length}):
          </p>
          <div className="flex -space-x-2">
            {mutualMatches.slice(0, 5).map((profile) => (
              <Avatar key={profile.user_id} className="border-2 border-background">
                <AvatarImage src={profile.avatar_url || ''} />
                <AvatarFallback>
                  {profile.display_name?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            ))}
            {mutualMatches.length > 5 && (
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted border-2 border-background text-xs font-medium">
                +{mutualMatches.length - 5}
              </div>
            )}
          </div>
        </div>
      )}

      {totalConnections > 0 && (
        <div className="pt-2 border-t">
          <p className="text-sm text-center text-muted-foreground">
            You have {totalConnections} mutual connection{totalConnections !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </Card>
  );
};