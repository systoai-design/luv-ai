import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Heart, MessageCircle, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface SuperLikeNotification {
  id: string;
  sender_id: string;
  created_at: string;
  viewed: boolean;
  sender: {
    display_name: string;
    avatar_url: string | null;
  };
}

interface ChatRequestNotification {
  id: string;
  sender_id: string;
  message: string | null;
  status: string;
  created_at: string;
  sender: {
    display_name: string;
    avatar_url: string | null;
  };
}

const Notifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [superLikes, setSuperLikes] = useState<SuperLikeNotification[]>([]);
  const [chatRequests, setChatRequests] = useState<ChatRequestNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    loadNotifications();
    markSuperLikesAsViewed();
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;

    try {
      // Fetch super like notifications with sender profiles
      const { data: superLikeData } = await supabase
        .from('super_like_notifications')
        .select('id, sender_id, created_at, viewed')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false });

      // Fetch sender profiles for super likes
      if (superLikeData && superLikeData.length > 0) {
        const senderIds = superLikeData.map(n => n.sender_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', senderIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
        const superLikesWithProfiles = superLikeData.map(n => ({
          ...n,
          sender: {
            display_name: profileMap.get(n.sender_id)?.display_name || 'User',
            avatar_url: profileMap.get(n.sender_id)?.avatar_url || null
          }
        }));
        setSuperLikes(superLikesWithProfiles);
      }

      // Fetch chat requests with sender profiles
      const { data: chatRequestData } = await supabase
        .from('chat_requests')
        .select('id, sender_id, message, status, created_at')
        .eq('receiver_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      // Fetch sender profiles for chat requests
      if (chatRequestData && chatRequestData.length > 0) {
        const senderIds = chatRequestData.map(r => r.sender_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', senderIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
        const chatRequestsWithProfiles = chatRequestData.map(r => ({
          ...r,
          sender: {
            display_name: profileMap.get(r.sender_id)?.display_name || 'User',
            avatar_url: profileMap.get(r.sender_id)?.avatar_url || null
          }
        }));
        setChatRequests(chatRequestsWithProfiles);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markSuperLikesAsViewed = async () => {
    if (!user) return;

    try {
      await supabase
        .from('super_like_notifications')
        .update({ viewed: true })
        .eq('recipient_id', user.id)
        .eq('viewed', false);
    } catch (error) {
      console.error('Error marking notifications as viewed:', error);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const { data: matchId } = await supabase.rpc('accept_chat_request', {
        request_id: requestId
      });

      if (matchId) {
        toast.success('Chat request accepted!');
        loadNotifications();
        navigate('/messages');
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      toast.error('Failed to accept request');
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      await supabase
        .from('chat_requests')
        .update({ status: 'declined' })
        .eq('id', requestId);

      toast.success('Chat request declined');
      loadNotifications();
    } catch (error) {
      console.error('Error declining request:', error);
      toast.error('Failed to decline request');
    }
  };

  const totalNotifications = superLikes.length + chatRequests.length;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-muted-foreground">Loading notifications...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          {totalNotifications === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No Notifications</h3>
              <p className="text-muted-foreground">
                You're all caught up! Check back later for updates
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Super Like Notifications */}
              {superLikes.map((notification) => (
                <div
                  key={notification.id}
                  className="flex items-start gap-4 p-4 rounded-lg border border-border/50 hover:bg-accent/5 transition-colors"
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={notification.sender.avatar_url || ''} />
                    <AvatarFallback>
                      <User className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Heart className="h-4 w-4 text-verified fill-verified" />
                      <p className="font-medium">
                        {notification.sender.display_name} super liked you!
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <Button
                    onClick={() => navigate(`/public-profile/${notification.sender_id}`)}
                    size="sm"
                    variant="outline"
                  >
                    View Profile
                  </Button>
                </div>
              ))}

              {/* Chat Request Notifications */}
              {chatRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-start gap-4 p-4 rounded-lg border border-border/50 hover:bg-accent/5 transition-colors"
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={request.sender.avatar_url || ''} />
                    <AvatarFallback>
                      <User className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageCircle className="h-4 w-4 text-primary" />
                      <p className="font-medium">
                        {request.sender.display_name} wants to chat with you
                      </p>
                    </div>
                    {request.message && (
                      <p className="text-sm text-muted-foreground mb-2">
                        "{request.message}"
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleAcceptRequest(request.id)}
                      size="sm"
                      variant="default"
                    >
                      Accept
                    </Button>
                    <Button
                      onClick={() => handleDeclineRequest(request.id)}
                      size="sm"
                      variant="outline"
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Notifications;
