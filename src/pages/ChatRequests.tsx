import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatRequestCard } from "@/components/chat/ChatRequestCard";
import { useChatRequests } from "@/hooks/useChatRequests";
import { useChatRequest } from "@/hooks/useChatRequest";
import { Loader2, Inbox } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ChatRequests = () => {
  const { receivedRequests, sentRequests, loading } = useChatRequests();
  const navigate = useNavigate();

  const handleAccept = async (requestId: string) => {
    const request = receivedRequests.find(r => r.id === requestId);
    if (!request) return;

    const { acceptRequest } = useChatRequest(request.sender_id);
    const matchId = await acceptRequest();
    
    if (matchId) {
      navigate('/messages');
    }
  };

  const handleReject = async (requestId: string) => {
    const request = receivedRequests.find(r => r.id === requestId);
    if (!request) return;

    const { rejectRequest } = useChatRequest(request.sender_id);
    await rejectRequest();
  };

  const handleCancel = async (requestId: string) => {
    const request = sentRequests.find(r => r.id === requestId);
    if (!request) return;

    const { cancelRequest } = useChatRequest(request.receiver_id);
    await cancelRequest();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Chat Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="received">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="received">
                Received {receivedRequests.length > 0 && `(${receivedRequests.length})`}
              </TabsTrigger>
              <TabsTrigger value="sent">
                Sent {sentRequests.length > 0 && `(${sentRequests.length})`}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="received" className="space-y-4">
              {receivedRequests.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Inbox className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No chat requests yet.</p>
                  <p className="text-sm mt-1">People can request to chat from your profile.</p>
                </div>
              ) : (
                receivedRequests.map((request) => (
                  <ChatRequestCard
                    key={request.id}
                    id={request.id}
                    displayName={request.sender?.display_name || 'User'}
                    username={request.sender?.username || 'user'}
                    avatarUrl={request.sender?.avatar_url}
                    message={request.message || undefined}
                    createdAt={request.created_at}
                    type="received"
                    onAccept={handleAccept}
                    onReject={handleReject}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="sent" className="space-y-4">
              {sentRequests.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Inbox className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>You haven't sent any chat requests yet.</p>
                </div>
              ) : (
                sentRequests.map((request) => (
                  <ChatRequestCard
                    key={request.id}
                    id={request.id}
                    displayName={request.receiver?.display_name || 'User'}
                    username={request.receiver?.username || 'user'}
                    avatarUrl={request.receiver?.avatar_url}
                    message={request.message || undefined}
                    createdAt={request.created_at}
                    type="sent"
                    onCancel={handleCancel}
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatRequests;
