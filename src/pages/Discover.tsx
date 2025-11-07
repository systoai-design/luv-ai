import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DiscoverCard from '@/components/discover/DiscoverCard';
import MatchModal from '@/components/discover/MatchModal';
import { Loader2 } from 'lucide-react';

interface DiscoverProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  interests: string[] | null;
}

const Discover = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<DiscoverProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [matchedProfile, setMatchedProfile] = useState<DiscoverProfile | null>(null);

  useEffect(() => {
    if (!user) return;
    loadProfiles();
  }, [user]);

  const loadProfiles = async () => {
    if (!user) return;

    try {
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
        .limit(20);

      if (error) throw error;
      setProfiles(data || []);
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

  if (!profiles.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h2 className="text-2xl font-bold mb-2">No More Profiles</h2>
        <p className="text-muted-foreground mb-4">Check back later for more people to discover!</p>
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
