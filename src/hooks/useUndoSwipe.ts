import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useUndoSwipe = () => {
  const { user } = useAuth();
  const [remaining, setRemaining] = useState(3);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadRemaining();
    }
  }, [user]);

  const loadRemaining = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('undo_usage')
        .select('count')
        .eq('user_id', user.id)
        .eq('usage_date', new Date().toISOString().split('T')[0])
        .maybeSingle();

      setRemaining(3 - (data?.count || 0));
    } catch (error) {
      console.error('Error loading undo count:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkLimit = async (): Promise<{ allowed: boolean; remaining: number }> => {
    if (!user) return { allowed: false, remaining: 0 };

    try {
      const { data, error } = await supabase.rpc('check_undo_limit', {
        p_user_id: user.id,
      });

      if (error) throw error;

      const result = data as { allowed: boolean; remaining: number };
      setRemaining(result.remaining);
      return result;
    } catch (error) {
      console.error('Error checking undo limit:', error);
      return { allowed: false, remaining: 0 };
    }
  };

  return { remaining, loading, checkLimit, refreshRemaining: loadRemaining };
};