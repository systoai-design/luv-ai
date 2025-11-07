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
      // Record the swipe
      const { error: swipeError } = await supabase
        .from('swipes')
        .insert({
          user_id: user.id,
          target_user_id: targetUserId,
          action,
        });

      if (swipeError) throw swipeError;

      // Check if this creates a match
      if (action === 'like' || action === 'super_like') {
        const userId1 = user.id < targetUserId ? user.id : targetUserId;
        const userId2 = user.id < targetUserId ? targetUserId : user.id;

        const { data: match, error: matchError } = await supabase
          .from('matches')
          .select('*')
          .eq('user_id_1', userId1)
          .eq('user_id_2', userId2)
          .maybeSingle();

        if (matchError) throw matchError;

        setIsLoading(false);
        return match;
      }

      setIsLoading(false);
      return null;
    } catch (error) {
      console.error('Error swiping:', error);
      toast.error('Failed to record swipe');
      setIsLoading(false);
      return null;
    }
  };

  return { swipe, isLoading };
};
