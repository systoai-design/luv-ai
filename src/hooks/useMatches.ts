import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Match {
  id: string;
  user_id_1: string;
  user_id_2: string;
  created_at: string;
  last_message_at: string | null;
  unread_count_1: number;
  unread_count_2: number;
  profile: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
  };
}

export const useMatches = () => {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadMatches = async () => {
      try {
        const { data, error } = await supabase
          .from('matches')
          .select(`
            *,
            profile_1:profiles!matches_user_id_1_profiles_fkey(*),
            profile_2:profiles!matches_user_id_2_profiles_fkey(*)
          `)
          .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`)
          .order('last_message_at', { ascending: false, nullsFirst: false });

        if (error) throw error;

        // Format matches with the other user's profile
        const formattedMatches = data?.map((match: any) => {
          const isUser1 = match.user_id_1 === user.id;
          const otherProfile = isUser1 ? match.profile_2 : match.profile_1;

          return {
            ...match,
            profile: otherProfile,
          };
        }) || [];

        setMatches(formattedMatches);
      } catch (error) {
        console.error('Error loading matches:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMatches();

    // Subscribe to new matches
    const channel = supabase
      .channel('matches-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
        },
        () => {
          loadMatches();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { matches, loading };
};
