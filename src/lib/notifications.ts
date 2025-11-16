import { supabase } from '@/integrations/supabase/client';

interface SendNotificationParams {
  userIds: string[];
  type: 'match' | 'message' | 'video_call' | 'system';
  title: string;
  message: string;
  relatedId?: string;
  url?: string;
}

/**
 * Send notifications to users (both in-app and push)
 */
export const sendNotifications = async ({
  userIds,
  type,
  title,
  message,
  relatedId,
  url,
}: SendNotificationParams) => {
  try {
    // Insert in-app notifications
    const notifications = userIds.map((userId) => ({
      user_id: userId,
      type,
      title,
      message,
      related_id: relatedId || null,
      read: false,
    }));

    const { error: dbError } = await supabase
      .from('notifications')
      .insert(notifications);

    if (dbError) {
      console.error('Error inserting notifications:', dbError);
      throw dbError;
    }

    // Send push notifications via edge function
    try {
      const { error: pushError } = await supabase.functions.invoke('send-notification', {
        body: {
          user_ids: userIds,
          title,
          body: message,
          url: url || '/',
          tag: type,
        },
      });

      if (pushError) {
        console.error('Error sending push notifications:', pushError);
        // Don't throw - push is optional, in-app notification already sent
      }
    } catch (pushError) {
      console.error('Error calling push notification function:', pushError);
      // Don't throw - push is optional
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending notifications:', error);
    return { success: false, error };
  }
};

/**
 * Send a match notification to both users
 */
export const sendMatchNotification = async (userId1: string, userId2: string, matchId: string) => {
  return sendNotifications({
    userIds: [userId1, userId2],
    type: 'match',
    title: "It's a Match! 🎉",
    message: "You have a new match! Start chatting now.",
    relatedId: matchId,
    url: '/matches',
  });
};

/**
 * Send a message notification
 */
export const sendMessageNotification = async (
  recipientId: string,
  senderName: string,
  messagePreview: string,
  matchId: string
) => {
  return sendNotifications({
    userIds: [recipientId],
    type: 'message',
    title: `New message from ${senderName}`,
    message: messagePreview,
    relatedId: matchId,
    url: `/chat/${matchId}`,
  });
};

/**
 * Send a video call notification
 */
export const sendVideoCallNotification = async (
  recipientId: string,
  callerName: string,
  matchId: string
) => {
  return sendNotifications({
    userIds: [recipientId],
    type: 'video_call',
    title: `Video call from ${callerName}`,
    message: `${callerName} is calling you`,
    relatedId: matchId,
    url: `/video/${matchId}`,
  });
};