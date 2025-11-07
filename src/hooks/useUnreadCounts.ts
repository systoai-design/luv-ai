import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useUnreadCounts = () => {
  const { user } = useAuth();
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadLikes, setUnreadLikes] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Load initial counts
    loadCounts();

    // Set up real-time subscriptions
    const notificationsChannel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadCounts();
        }
      )
      .subscribe();

    const messagesChannel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        () => {
          loadCounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notificationsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [user]);

  const loadCounts = async () => {
    if (!user) return;

    try {
      // Get unread messages from matches
      const { data: matches } = await supabase
        .from('matches')
        .select('id, user_id_1, user_id_2, unread_count_1, unread_count_2')
        .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`);
      
      const totalUnreadMessages = matches?.reduce((sum, match) => {
        return sum + (match.user_id_1 === user.id ? match.unread_count_1 : match.unread_count_2);
      }, 0) || 0;

      // Get unread likes (people who liked you but you haven't swiped on yet)
      const { data: incomingSwipes } = await supabase
        .from('swipes')
        .select('user_id')
        .eq('target_user_id', user.id)
        .in('action', ['like', 'super_like']);

      const { data: userSwipes } = await supabase
        .from('swipes')
        .select('target_user_id')
        .eq('user_id', user.id);

      const { data: existingMatches } = await supabase
        .from('matches')
        .select('user_id_1, user_id_2')
        .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`);

      const swipedIds = new Set(userSwipes?.map(s => s.target_user_id) || []);
      const matchedIds = new Set(
        existingMatches?.map(m => 
          m.user_id_1 === user.id ? m.user_id_2 : m.user_id_1
        ) || []
      );

      const unreadLikesCount = incomingSwipes?.filter(
        s => !swipedIds.has(s.user_id) && !matchedIds.has(s.user_id)
      ).length || 0;

      setUnreadNotifications(0); // Placeholder for future notifications
      setUnreadMessages(totalUnreadMessages);
      setUnreadLikes(unreadLikesCount);
    } catch (error) {
      console.error('Error loading unread counts:', error);
    }
  };

  return { unreadNotifications, unreadMessages, unreadLikes };
};
