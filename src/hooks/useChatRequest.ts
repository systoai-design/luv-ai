import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

type RequestStatus = 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'rejected' | 'cancelled';

export const useChatRequest = (otherUserId?: string) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<RequestStatus>('none');
  const [requestId, setRequestId] = useState<string | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !otherUserId) return;
    checkRequestStatus();

    // Subscribe to changes
    const channel = supabase
      .channel('chat-request-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_requests',
          filter: `sender_id=eq.${user.id},receiver_id=eq.${otherUserId}`,
        },
        () => checkRequestStatus()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_requests',
          filter: `sender_id=eq.${otherUserId},receiver_id=eq.${user.id}`,
        },
        () => checkRequestStatus()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, otherUserId]);

  const checkRequestStatus = async () => {
    if (!user || !otherUserId) return;

    try {
      // Check for existing request in either direction
      const { data: sentRequest } = await supabase
        .from('chat_requests')
        .select('id, status')
        .eq('sender_id', user.id)
        .eq('receiver_id', otherUserId)
        .maybeSingle();

      const { data: receivedRequest } = await supabase
        .from('chat_requests')
        .select('id, status')
        .eq('sender_id', otherUserId)
        .eq('receiver_id', user.id)
        .maybeSingle();

      if (sentRequest) {
        setRequestId(sentRequest.id);
        if (sentRequest.status === 'accepted') {
          await checkForMatch();
          setStatus('accepted');
        } else if (sentRequest.status === 'pending') {
          setStatus('pending_sent');
        } else {
          setStatus('none');
        }
      } else if (receivedRequest) {
        setRequestId(receivedRequest.id);
        if (receivedRequest.status === 'accepted') {
          await checkForMatch();
          setStatus('accepted');
        } else if (receivedRequest.status === 'pending') {
          setStatus('pending_received');
        } else {
          setStatus('none');
        }
      } else {
        // No request, check if match already exists
        await checkForMatch();
        if (!matchId) {
          setStatus('none');
        }
      }
    } catch (error) {
      console.error('Error checking request status:', error);
    }
  };

  const checkForMatch = async () => {
    if (!user || !otherUserId) return;

    const userId1 = user.id < otherUserId ? user.id : otherUserId;
    const userId2 = user.id < otherUserId ? otherUserId : user.id;

    const { data: match } = await supabase
      .from('matches')
      .select('id')
      .eq('user_id_1', userId1)
      .eq('user_id_2', userId2)
      .maybeSingle();

    if (match) {
      setMatchId(match.id);
      setStatus('accepted');
    }
  };

  const sendRequest = async (message?: string) => {
    if (!user || !otherUserId) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('chat_requests')
        .insert({
          sender_id: user.id,
          receiver_id: otherUserId,
          message: message || null,
        });

      if (error) throw error;

      toast.success('Chat request sent!');
      await checkRequestStatus();
    } catch (error: any) {
      console.error('Error sending request:', error);
      toast.error(error.message || 'Failed to send request');
    } finally {
      setLoading(false);
    }
  };

  const acceptRequest = async () => {
    if (!user || !requestId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('accept_chat_request', {
        request_id: requestId,
      });

      if (error) throw error;

      setMatchId(data);
      toast.success('Chat request accepted!');
      await checkRequestStatus();
      return data;
    } catch (error: any) {
      console.error('Error accepting request:', error);
      toast.error(error.message || 'Failed to accept request');
    } finally {
      setLoading(false);
    }
  };

  const rejectRequest = async () => {
    if (!user || !requestId) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('chat_requests')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', requestId);

      if (error) throw error;

      toast.success('Chat request declined');
      await checkRequestStatus();
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      toast.error(error.message || 'Failed to decline request');
    } finally {
      setLoading(false);
    }
  };

  const cancelRequest = async () => {
    if (!user || !requestId) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('chat_requests')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', requestId);

      if (error) throw error;

      toast.success('Chat request cancelled');
      await checkRequestStatus();
    } catch (error: any) {
      console.error('Error cancelling request:', error);
      toast.error(error.message || 'Failed to cancel request');
    } finally {
      setLoading(false);
    }
  };

  return {
    status,
    matchId,
    loading,
    sendRequest,
    acceptRequest,
    rejectRequest,
    cancelRequest,
  };
};
