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

      // For super likes, check limit first
      if (action === 'super_like') {
        const { data: limitCheck } = await supabase.rpc('check_super_like_limit', {
          p_user_id: user.id,
        });

        if (limitCheck && !(limitCheck as any).allowed) {
          toast.error("You've used all 5 Super Likes today! Resets tomorrow.");
          setIsLoading(false);
          return null;
        }

        // Send notification to recipient
        await supabase
          .from('super_like_notifications')
          .insert({
            sender_id: user.id,
            recipient_id: targetUserId,
          });
      }

      // Check if swipe already exists
      const { data: existingSwipe } = await supabase
        .from('swipes')
        .select('*')
        .eq('user_id', user.id)
        .eq('target_user_id', targetUserId)
        .maybeSingle();

      let swipeData;
      
      if (existingSwipe) {
        // If same action, treat as idempotent (continue to match check)
        if (existingSwipe.action === action) {
          swipeData = existingSwipe;
        } else {
          // Different action, update the existing swipe
          const { data: updatedSwipe, error: updateError } = await supabase
            .from('swipes')
            .update({ action })
            .eq('id', existingSwipe.id)
            .select()
            .single();

          if (updateError) {
            console.error('Swipe update error:', updateError);
            toast.error('Failed to update swipe');
            setIsLoading(false);
            return null;
          }
          swipeData = updatedSwipe;
        }
      } else {
        // Insert new swipe
        const { data: newSwipe, error: swipeError } = await supabase
          .from('swipes')
          .insert({
            user_id: user.id,
            target_user_id: targetUserId,
            action,
          })
          .select()
          .single();

        if (swipeError) {
          console.error('Swipe error:', swipeError);
          toast.error('Failed to record swipe. Moving to next profile...');
          setIsLoading(false);
          return null;
        }
        swipeData = newSwipe;
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
        return { match, swipeId: swipeData?.id };
      }

      setIsLoading(false);
      return { match: null, swipeId: swipeData?.id };
    } catch (error: any) {
      console.error('Error swiping:', error);
      toast.error(`Failed to record swipe: ${error?.message || 'Unknown error'}`);
      setIsLoading(false);
      return null;
    }
  };

  return { swipe, isLoading };
};
