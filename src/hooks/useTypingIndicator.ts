import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TypingUser {
  userId: string;
  displayName?: string;
}

export const useTypingIndicator = (matchId: string) => {
  const { user } = useAuth();
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [channel, setChannel] = useState<any>(null);

  useEffect(() => {
    if (!user || !matchId) return;

    const presenceChannel = supabase.channel(`match-${matchId}-presence`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const typing: TypingUser[] = [];

        Object.keys(state).forEach((key) => {
          const presences = state[key];
          presences.forEach((presence: any) => {
            if (presence.typing && presence.userId !== user.id) {
              typing.push({
                userId: presence.userId,
                displayName: presence.displayName,
              });
            }
          });
        });

        setTypingUsers(typing);
      })
      .subscribe();

    setChannel(presenceChannel);

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [matchId, user]);

  const setTyping = async (isTyping: boolean, displayName?: string) => {
    if (!channel || !user) return;

    await channel.track({
      userId: user.id,
      typing: isTyping,
      displayName: displayName || 'User',
      timestamp: Date.now(),
    });
  };

  return { typingUsers, setTyping };
};
