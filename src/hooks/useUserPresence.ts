import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useUserPresence = () => {
  const { user } = useAuth();
  const heartbeatInterval = useRef<NodeJS.Timeout>();

  const updatePresence = async (online: boolean) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_presence')
        .upsert({
          user_id: user.id,
          online,
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  };

  const startHeartbeat = () => {
    // Update presence immediately
    updatePresence(true);

    // Then update every 30 seconds
    heartbeatInterval.current = setInterval(() => {
      updatePresence(true);
    }, 30000);
  };

  const stopHeartbeat = () => {
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
    }
    updatePresence(false);
  };

  useEffect(() => {
    if (!user) return;

    startHeartbeat();

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopHeartbeat();
      } else {
        startHeartbeat();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup on unmount
    return () => {
      stopHeartbeat();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  return { updatePresence };
};
