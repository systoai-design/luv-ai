import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useRequestNotifications = () => {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    loadCount();

    // Subscribe to changes
    const channel = supabase
      .channel('request-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_requests',
          filter: `receiver_id=eq.${user.id}`,
        },
        () => loadCount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadCount = async () => {
    if (!user) return;

    try {
      const { count: requestCount } = await supabase
        .from('chat_requests')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('status', 'pending');

      setCount(requestCount || 0);
    } catch (error) {
      console.error('Error loading notification count:', error);
    } finally {
      setLoading(false);
    }
  };

  return { count, loading };
};
