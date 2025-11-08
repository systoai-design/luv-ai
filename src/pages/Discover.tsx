import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import DiscoverCard from '@/components/discover/DiscoverCard';
import MatchModal from '@/components/discover/MatchModal';
import { calculateMatchScore } from '@/lib/interests';
import { Loader2, Heart, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useUndoSwipe } from '@/hooks/useUndoSwipe';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface DiscoverProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  interests: string[] | null;
  matchScore?: number;
  matchPercentage?: number;
  sharedInterests?: string[];
}

const Discover = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<DiscoverProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [matchedProfile, setMatchedProfile] = useState<DiscoverProfile | null>(null);
  const [userInterests, setUserInterests] = useState<string[]>([]);
  const [needsInterests, setNeedsInterests] = useState(false);
  const [lastSwipe, setLastSwipe] = useState<{
    targetUserId: string;
    action: 'like' | 'pass' | 'super_like';
    swipeId: string;
    timestamp: number;
    profileIndex: number;
    matchCreated: boolean;
    matchId?: string;
  } | null>(null);
  const [showUndo, setShowUndo] = useState(false);
  const { remaining: undoRemaining, checkLimit: checkUndoLimit, refreshRemaining: refreshUndo } = useUndoSwipe();

  useEffect(() => {
    if (!user) return;
    loadProfiles();

    // Subscribe to realtime match notifications
    const matchChannel = supabase
      .channel('match-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
          filter: `user_id_1=eq.${user.id},user_id_2=eq.${user.id}`,
        },
        async (payload) => {
          console.log('New match detected!', payload);
          
          // Determine the other user ID
          const match = payload.new as any;
          const otherUserId = match.user_id_1 === user.id ? match.user_id_2 : match.user_id_1;
          
          // Fetch the matched user's profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', otherUserId)
            .single();
          
          if (profile) {
            setMatchedProfile(profile);
            toast.success("It's a match! 💕");
          }
        }
      )
      .subscribe();

    // Subscribe to super like notifications
    const superLikeChannel = supabase
      .channel('super-like-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'super_like_notifications',
          filter: `recipient_id=eq.${user.id}`,
        },
        async (payload) => {
          const notification = payload.new as any;
          
          // Fetch sender's profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('user_id', notification.sender_id)
            .single();
          
          if (profile) {
            toast.success(`💫 ${profile.display_name || 'Someone'} sent you a Super Like!`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(matchChannel);
      supabase.removeChannel(superLikeChannel);
    };
  }, [user]);

  const loadProfiles = async () => {
    if (!user) return;

    try {
      // Get current user's profile and interests
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('interests')
        .eq('user_id', user.id)
        .single();

      const interests = currentProfile?.interests || [];
      setUserInterests(interests);

      // If no interests, prompt user to add them
      if (interests.length === 0) {
        setNeedsInterests(true);
        setLoading(false);
        return;
      }

      // Get users that current user has already swiped on
      const { data: swipedUsers } = await supabase
        .from('swipes')
        .select('target_user_id')
        .eq('user_id', user.id);

      const swipedIds = swipedUsers?.map((s) => s.target_user_id) || [];

      // Get profiles excluding current user and already swiped users - fix UUID quoting
      const baseQuery = supabase
        .from('profiles')
        .select('*')
        .neq('user_id', user.id)
        .not('interests', 'is', null)
        .limit(50);

      // Only add the NOT IN clause if there are IDs to exclude
      const { data, error } = swipedIds.length > 0
        ? await baseQuery.not('user_id', 'in', `(${swipedIds.join(',')})`)
        : await baseQuery;

      if (error) throw error;

      // Calculate match scores and filter for at least 1 shared interest
      const profilesWithScores = (data || [])
        .map((profile) => {
          const { score, percentage, shared } = calculateMatchScore(
            interests,
            profile.interests || []
          );
          return {
            ...profile,
            matchScore: score,
            matchPercentage: percentage,
            sharedInterests: shared,
          };
        })
        .filter((p) => p.matchScore > 0) // At least 1 shared interest
        .sort((a, b) => b.matchScore - a.matchScore); // Sort by compatibility

      setProfiles(profilesWithScores);
    } catch (error) {
      console.error('Error loading profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = (swipeData: { match: any; swipeId: string }, action: 'like' | 'pass' | 'super_like') => {
    const currentProfile = profiles[currentIndex];
    
    // Store swipe for undo
    setLastSwipe({
      targetUserId: currentProfile.user_id,
      action,
      swipeId: swipeData.swipeId,
      timestamp: Date.now(),
      profileIndex: currentIndex,
      matchCreated: !!swipeData.match,
      matchId: swipeData.match?.id,
    });
    
    setShowUndo(true);
    
    // Auto-hide undo after 10 seconds
    setTimeout(() => setShowUndo(false), 10000);
    
    if (swipeData.match) {
      setMatchedProfile(currentProfile);
    }
    
    // Move to next profile
    if (currentIndex < profiles.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
      loadProfiles();
    }
  };

  const handleUndo = async () => {
    if (!lastSwipe || !user) return;

    const { allowed, remaining } = await checkUndoLimit();
    
    if (!allowed) {
      toast.error("You've used all 3 undos today! Resets tomorrow.");
      return;
    }

    try {
      // Delete the swipe record
      await supabase
        .from('swipes')
        .delete()
        .eq('id', lastSwipe.swipeId);

      // If a match was created, delete it
      if (lastSwipe.matchCreated && lastSwipe.matchId) {
        await supabase
          .from('matches')
          .delete()
          .eq('id', lastSwipe.matchId);
      }

      // Restore the profile
      setCurrentIndex(lastSwipe.profileIndex);
      setShowUndo(false);
      setLastSwipe(null);
      
      await refreshUndo();
      toast.success(`Swipe undone! ${remaining} undo${remaining !== 1 ? 's' : ''} left today`);
    } catch (error) {
      console.error('Error undoing swipe:', error);
      toast.error('Failed to undo swipe');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6 text-center">
          <Skeleton className="h-10 w-40 mx-auto mb-2" />
          <Skeleton className="h-5 w-32 mx-auto" />
        </div>
        
        <Card className="animate-pulse">
          <CardHeader className="space-y-4">
            <Skeleton className="h-64 w-full rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Skeleton className="h-12 flex-1" />
              <Skeleton className="h-12 flex-1" />
              <Skeleton className="h-12 flex-1" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-12 flex-1" />
              <Skeleton className="h-12 flex-1" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (needsInterests) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-card border rounded-lg p-8 text-center shadow-sm">
          <Heart className="h-16 w-16 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Let's Get You Started!</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Add interests to your profile to find compatible matches. 
            We'll show you people who share your passions!
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button onClick={() => navigate('/profile')}>
              Add Interests to Profile
            </Button>
            <Button variant="outline" onClick={() => navigate('/home')}>
              Skip for Now
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!profiles.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] p-4 text-center">
        <Heart className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">You've Seen Everyone!</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          {userInterests.length > 0 
            ? "You've swiped on everyone with matching interests. Check your 'Likes You' page to see who liked you, or visit 'Your Likes' to see who you're waiting on!"
            : "No more profiles to show. Add interests to your profile to find more matches!"}
        </p>
        <div className="flex gap-3 flex-wrap justify-center">
          <Button onClick={() => navigate('/likes-received')}>
            See Who Likes You
          </Button>
          <Button onClick={() => navigate('/likes-sent')} variant="outline">
            Your Pending Likes
          </Button>
          {userInterests.length === 0 && (
            <Button onClick={() => navigate('/profile')} variant="secondary">
              Add Interests
            </Button>
          )}
        </div>
      </div>
    );
  }

  const currentProfile = profiles[currentIndex];
  const nextProfile = profiles[currentIndex + 1];

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold mb-2">Discover</h1>
        <p className="text-muted-foreground">
          {profiles.length - currentIndex} profiles remaining
        </p>
      </div>

      <div className="relative">
        {/* Card 3 - Further behind */}
        {profiles[currentIndex + 2] && (
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              transform: 'translate3d(0, 16px, 0) scale(0.90)',
              opacity: 0.3,
              zIndex: 0,
              transition: 'all 0.3s ease-out',
            }}
          >
            <Card className="w-full h-full bg-card/30 backdrop-blur-sm border-border/20" />
          </div>
        )}
        
        {/* Card 2 - Behind current */}
        {profiles[currentIndex + 1] && (
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              transform: 'translate3d(0, 8px, 0) scale(0.95)',
              opacity: 0.5,
              zIndex: 1,
              transition: 'all 0.3s ease-out',
            }}
          >
            <Card className="w-full h-full bg-card/50 backdrop-blur-sm border-border/30" />
          </div>
        )}
        
        {/* Current card (foreground) - interactive */}
        {currentProfile && (
          <div 
            key={currentProfile.id}
            style={{ position: 'relative', zIndex: 10 }}
          >
            <DiscoverCard profile={currentProfile} onSwipe={handleSwipe} />
          </div>
        )}
      </div>

      {showUndo && lastSwipe && Date.now() - lastSwipe.timestamp < 10000 && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <Button
            size="lg"
            variant="secondary"
            className="gap-2 shadow-lg"
            onClick={handleUndo}
          >
            <RotateCcw className="h-5 w-5" />
            Undo ({undoRemaining} left)
          </Button>
        </div>
      )}

      {matchedProfile && (
        <MatchModal
          profile={matchedProfile}
          onClose={() => setMatchedProfile(null)}
        />
      )}
    </div>
  );
};

export default Discover;
