import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader2, Heart } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

interface LikeSent {
  id: string;
  target_user_id: string;
  action: string;
  created_at: string;
  profile: {
    user_id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
    bio: string | null;
    interests: string[] | null;
  };
}

const LikesSent = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [likes, setLikes] = useState<LikeSent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadLikesSent();
  }, [user]);

  const loadLikesSent = async () => {
    if (!user) return;

    try {
      // Get all likes/super_likes sent by this user
      const { data: swipes, error: swipesError } = await supabase
        .from('swipes')
        .select('*')
        .eq('user_id', user.id)
        .in('action', ['like', 'super_like'])
        .order('created_at', { ascending: false });

      if (swipesError) throw swipesError;

      // Get matches to filter out already matched users
      const { data: matches } = await supabase
        .from('matches')
        .select('user_id_1, user_id_2')
        .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`);

      const matchedUserIds = new Set(
        matches?.map(m => 
          m.user_id_1 === user.id ? m.user_id_2 : m.user_id_1
        ) || []
      );

      // Filter out matched users
      const unmatchedSwipes = swipes?.filter(
        s => !matchedUserIds.has(s.target_user_id)
      ) || [];

      // Fetch profiles for unmatched likes
      const targetUserIds = unmatchedSwipes.map(s => s.target_user_id);
      
      if (targetUserIds.length === 0) {
        setLikes([]);
        setLoading(false);
        return;
      }

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', targetUserIds);

      if (profilesError) throw profilesError;

      // Combine swipes with profiles
      const likesWithProfiles = unmatchedSwipes
        .map(swipe => {
          const profile = profiles?.find(p => p.user_id === swipe.target_user_id);
          return profile ? { ...swipe, profile } : null;
        })
        .filter(Boolean) as LikeSent[];

      setLikes(likesWithProfiles);
    } catch (error) {
      console.error('Error loading likes sent:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-square w-full" />
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <div className="flex gap-1">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!likes.length) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center space-y-4">
          <Heart className="h-16 w-16 text-muted-foreground mx-auto" />
          <h2 className="text-2xl font-bold">No Pending Likes</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            You haven't liked anyone yet, or they've all matched with you already!
          </p>
          <Button onClick={() => navigate('/discover')}>
            Discover People
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Your Likes</h1>
        <p className="text-muted-foreground">
          People you've liked who haven't matched with you yet ({likes.length})
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {likes.map((like) => (
          <Card 
            key={like.id} 
            className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate(`/profile/${like.profile.username || like.profile.user_id}`)}
          >
            <CardContent className="p-0">
              <div className="relative aspect-square">
                <Avatar className="w-full h-full rounded-none">
                  <AvatarImage 
                    src={like.profile.avatar_url || ''} 
                    className="object-cover"
                  />
                  <AvatarFallback className="rounded-none text-4xl">
                    {like.profile.display_name?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                {like.action === 'super_like' && (
                  <Badge className="absolute top-2 right-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
                    ⭐ Super Like
                  </Badge>
                )}
              </div>
              <div className="p-4 space-y-2">
                <h3 className="font-semibold text-lg truncate">
                  {like.profile.display_name || 'Anonymous'}
                </h3>
                {like.profile.bio && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {like.profile.bio}
                  </p>
                )}
                {like.profile.interests && like.profile.interests.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {like.profile.interests.slice(0, 3).map((interest, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {interest}
                      </Badge>
                    ))}
                    {like.profile.interests.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{like.profile.interests.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(like.created_at), { addSuffix: true })}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default LikesSent;
