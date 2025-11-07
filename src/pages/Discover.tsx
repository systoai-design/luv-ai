import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import DiscoverCard from '@/components/discover/DiscoverCard';
import MatchModal from '@/components/discover/MatchModal';
import { calculateMatchScore } from '@/lib/interests';
import { Loader2, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

  useEffect(() => {
    if (!user) return;
    loadProfiles();
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

      // Get profiles excluding current user and already swiped users
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('user_id', user.id)
        .not('user_id', 'in', `(${swipedIds.join(',') || 'null'})`)
        .not('interests', 'is', null)
        .limit(50);

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

  const handleSwipe = (matchData: any) => {
    if (matchData) {
      // Found a match!
      const matchedUser = profiles[currentIndex];
      setMatchedProfile(matchedUser);
    }
    
    // Move to next profile
    if (currentIndex < profiles.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Reload more profiles
      setCurrentIndex(0);
      loadProfiles();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (needsInterests) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <Heart className="h-16 w-16 text-primary mb-4" />
        <h2 className="text-2xl font-bold mb-2">Let's Get You Started!</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Add interests to your profile to find compatible matches. 
          We'll show you people who share your passions!
        </p>
        <Button onClick={() => navigate('/profile')}>
          Add Interests to Profile
        </Button>
      </div>
    );
  }

  if (!profiles.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h2 className="text-2xl font-bold mb-2">No Matches Found</h2>
        <p className="text-muted-foreground mb-4 max-w-md">
          {userInterests.length > 0 
            ? "No one with your interests right now. Try adding more interests or check back later!"
            : "Check back later for more people to discover!"}
        </p>
        {userInterests.length > 0 && (
          <Button onClick={() => navigate('/profile')} variant="outline">
            Update Interests
          </Button>
        )}
      </div>
    );
  }

  const currentProfile = profiles[currentIndex];

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold mb-2">Discover</h1>
        <p className="text-muted-foreground">
          {profiles.length - currentIndex} profiles remaining
        </p>
      </div>

      {currentProfile && (
        <DiscoverCard profile={currentProfile} onSwipe={handleSwipe} />
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
