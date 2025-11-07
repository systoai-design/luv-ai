import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useSwipe = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const swipe = async (targetUserId: string, action: 'like' | 'pass' | 'super_like') => {
    if (!user) return null;
    
    setIsLoading(true);
    try {
      // Verify auth state before swipe
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) {
        toast.error('Please sign in again to swipe');
        setIsLoading(false);
        return null;
      }

      // Record the swipe
      const { error: swipeError } = await supabase
        .from('swipes')
        .insert({
          user_id: user.id,
          target_user_id: targetUserId,
          action,
        });

      if (swipeError) {
        console.error('Swipe error:', swipeError);
        toast.error(`Failed to record swipe: ${swipeError.message || 'Unknown error'}`);
        setIsLoading(false);
        return null;
      }

      // Check if this creates a match using OR filter for both orderings
      if (action === 'like' || action === 'super_like') {
        const { data: match, error: matchError } = await supabase
          .from('matches')
          .select('*')
          .or(`and(user_id_1.eq.${user.id},user_id_2.eq.${targetUserId}),and(user_id_1.eq.${targetUserId},user_id_2.eq.${user.id})`)
          .maybeSingle();

        if (matchError) {
          console.error('Match check error:', matchError);
        }

        setIsLoading(false);
        return match;
      }

      setIsLoading(false);
      return null;
    } catch (error: any) {
      console.error('Error swiping:', error);
      toast.error(`Failed to record swipe: ${error?.message || 'Unknown error'}`);
      setIsLoading(false);
      return null;
    }
  };

  return { swipe, isLoading };
};
