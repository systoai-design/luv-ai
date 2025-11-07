import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader2, Heart } from 'lucide-react';
import DiscoverCard from '@/components/discover/DiscoverCard';
import MatchModal from '@/components/discover/MatchModal';
import { Button } from '@/components/ui/button';
import { calculateMatchScore } from '@/lib/interests';

interface LikeReceived {
  id: string;
  user_id: string;
  action: string;
  created_at: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  interests: string[] | null;
  matchScore?: number;
  matchPercentage?: number;
  sharedInterests?: string[];
}

const LikesReceived = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [likes, setLikes] = useState<LikeReceived[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [matchedProfile, setMatchedProfile] = useState<LikeReceived | null>(null);
  const [userInterests, setUserInterests] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    loadLikesReceived();
  }, [user]);

  const loadLikesReceived = async () => {
    if (!user) return;

    try {
      // Get current user's interests
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('interests')
        .eq('user_id', user.id)
        .single();

      const interests = currentProfile?.interests || [];
      setUserInterests(interests);

      // Get people who liked this user
      const { data: incomingSwipes, error: swipesError } = await supabase
        .from('swipes')
        .select('*')
        .eq('target_user_id', user.id)
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

      // Get swipes this user already made to exclude them
      const { data: userSwipes } = await supabase
        .from('swipes')
        .select('target_user_id')
        .eq('user_id', user.id);

      const alreadySwipedIds = new Set(
        userSwipes?.map(s => s.target_user_id) || []
      );

      // Filter for users not yet matched and not yet swiped on
      const unmatchedSwipes = incomingSwipes?.filter(
        s => !matchedUserIds.has(s.user_id) && !alreadySwipedIds.has(s.user_id)
      ) || [];

      // Fetch profiles
      const senderUserIds = unmatchedSwipes.map(s => s.user_id);
      
      if (senderUserIds.length === 0) {
        setLikes([]);
        setLoading(false);
        return;
      }

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', senderUserIds);

      if (profilesError) throw profilesError;

      // Combine with match scores
      const likesWithProfiles = unmatchedSwipes
        .map(swipe => {
          const profile = profiles?.find(p => p.user_id === swipe.user_id);
          if (!profile) return null;

          const { score, percentage, shared } = calculateMatchScore(
            interests,
            profile.interests || []
          );

          return {
            ...swipe,
            ...profile,
            matchScore: score,
            matchPercentage: percentage,
            sharedInterests: shared,
          };
        })
        .filter(Boolean) as LikeReceived[];

      setLikes(likesWithProfiles);
    } catch (error) {
      console.error('Error loading likes received:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = (swipeData: { match: any; swipeId: string }, action: 'like' | 'pass' | 'super_like') => {
    const currentProfile = likes[currentIndex];
    
    if (swipeData.match) {
      setMatchedProfile(currentProfile);
    }
    
    // Move to next profile
    if (currentIndex < likes.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
      loadLikesReceived();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!likes.length) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center space-y-4">
          <Heart className="h-16 w-16 text-muted-foreground mx-auto" />
          <h2 className="text-2xl font-bold">No New Likes</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            No one has liked you yet, or you've already swiped on everyone who liked you!
          </p>
          <Button onClick={() => navigate('/discover')}>
            Discover People
          </Button>
        </div>
      </div>
    );
  }

  const currentProfile = likes[currentIndex];
  const nextProfile = likes[currentIndex + 1];

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold mb-2">Likes You</h1>
        <p className="text-muted-foreground">
          {likes.length - currentIndex} {likes.length - currentIndex === 1 ? 'person' : 'people'} liked you
        </p>
      </div>

      <div className="relative">
        {nextProfile && (
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              transform: 'scale(0.95) translateY(10px)',
              opacity: 0.5,
              zIndex: 1,
            }}
          >
            <DiscoverCard profile={nextProfile} onSwipe={() => {}} />
          </div>
        )}
        
        {currentProfile && (
          <div 
            key={currentProfile.id}
            style={{ position: 'relative', zIndex: 2 }}
            className="animate-scale-in"
          >
            <DiscoverCard profile={currentProfile} onSwipe={handleSwipe} />
          </div>
        )}
      </div>

      {matchedProfile && (
        <MatchModal
          profile={matchedProfile}
          onClose={() => setMatchedProfile(null)}
        />
      )}
    </div>
  );
};

export default LikesReceived;
