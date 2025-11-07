import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface PresenceData {
  online: boolean;
  lastSeen: string;
  formattedLastSeen: string;
}

export const usePresenceDisplay = (userIds: string[]) => {
  const [presenceMap, setPresenceMap] = useState<Record<string, PresenceData>>({});

  useEffect(() => {
    if (!userIds.length) return;

    // Initial fetch
    const fetchPresence = async () => {
      const { data, error } = await supabase
        .from('user_presence')
        .select('*')
        .in('user_id', userIds);

      if (error) {
        console.error('Error fetching presence:', error);
        return;
      }

      const newPresenceMap: Record<string, PresenceData> = {};
      data?.forEach((presence) => {
        newPresenceMap[presence.user_id] = {
          online: presence.online,
          lastSeen: presence.last_seen,
          formattedLastSeen: formatLastSeen(presence.last_seen, presence.online),
        };
      });

      setPresenceMap(newPresenceMap);
    };

    fetchPresence();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('presence-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence',
          filter: `user_id=in.(${userIds.join(',')})`,
        },
        (payload: any) => {
          const newPresence = payload.new;
          if (newPresence) {
            setPresenceMap((prev) => ({
              ...prev,
              [newPresence.user_id]: {
                online: newPresence.online,
                lastSeen: newPresence.last_seen,
                formattedLastSeen: formatLastSeen(newPresence.last_seen, newPresence.online),
              },
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userIds.join(',')]);

  return presenceMap;
};

const formatLastSeen = (lastSeen: string, online: boolean): string => {
  if (online) return 'Active now';
  
  try {
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - lastSeenDate.getTime()) / 60000);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `Active ${diffMinutes}m ago`;
    
    return `Active ${formatDistanceToNow(lastSeenDate, { addSuffix: true })}`;
  } catch {
    return 'Offline';
  }
};
