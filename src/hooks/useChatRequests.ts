import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ChatRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  message: string | null;
  created_at: string;
  sender?: {
    user_id: string;
    display_name: string;
    username: string;
    avatar_url: string;
  };
  receiver?: {
    user_id: string;
    display_name: string;
    username: string;
    avatar_url: string;
  };
}

export const useChatRequests = () => {
  const { user } = useAuth();
  const [receivedRequests, setReceivedRequests] = useState<ChatRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<ChatRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    loadRequests();

    // Subscribe to changes
    const channel = supabase
      .channel('chat-requests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_requests',
        },
        () => loadRequests()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadRequests = async () => {
    if (!user) return;

    try {
      // Load received requests with sender profile
      const { data: received, error: receivedError } = await supabase
        .from('chat_requests')
        .select('*')
        .eq('receiver_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      // Load sent requests with receiver profile
      const { data: sent, error: sentError } = await supabase
        .from('chat_requests')
        .select('*')
        .eq('sender_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (receivedError) console.error('Error loading received requests:', receivedError);
      if (sentError) console.error('Error loading sent requests:', sentError);

      // Fetch profiles for received requests
      if (received && received.length > 0) {
        const senderIds = received.map(r => r.sender_id);
        const { data: senderProfiles } = await supabase
          .from('profiles')
          .select('user_id, display_name, username, avatar_url')
          .in('user_id', senderIds);

        const receivedWithProfiles = received.map(req => ({
          ...req,
          sender: senderProfiles?.find(p => p.user_id === req.sender_id),
        }));
        setReceivedRequests(receivedWithProfiles as ChatRequest[]);
      } else {
        setReceivedRequests([]);
      }

      // Fetch profiles for sent requests
      if (sent && sent.length > 0) {
        const receiverIds = sent.map(r => r.receiver_id);
        const { data: receiverProfiles } = await supabase
          .from('profiles')
          .select('user_id, display_name, username, avatar_url')
          .in('user_id', receiverIds);

        const sentWithProfiles = sent.map(req => ({
          ...req,
          receiver: receiverProfiles?.find(p => p.user_id === req.receiver_id),
        }));
        setSentRequests(sentWithProfiles as ChatRequest[]);
      } else {
        setSentRequests([]);
      }
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  return { receivedRequests, sentRequests, loading };
};
