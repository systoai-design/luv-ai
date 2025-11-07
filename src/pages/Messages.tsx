import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, Heart, Sparkles, Inbox } from "lucide-react";
import { useMatches } from "@/hooks/useMatches";
import { useRequestNotifications } from "@/hooks/useRequestNotifications";
import { formatDistanceToNow } from "date-fns";
import MatchChat from "@/components/matches/MatchChat";

const Messages = () => {
  const { matches, loading } = useMatches();
  const { count: requestCount } = useRequestNotifications();
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const navigate = useNavigate();

  const selectedMatchData = matches.find(m => m.id === selectedMatch);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Matches List */}
        <Card className="bg-card/50 border-border/50 lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary fill-primary" />
                Matches
              </CardTitle>
              {requestCount > 0 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/chat-requests')}
                >
                  <Inbox className="h-4 w-4 mr-2" />
                  Requests
                  <Badge variant="destructive" className="ml-2">
                    {requestCount}
                  </Badge>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="matches">
              <TabsList className="w-full">
                <TabsTrigger value="matches" className="flex-1">
                  <Heart className="h-4 w-4 mr-2" />
                  Matches
                </TabsTrigger>
                <TabsTrigger value="ai" className="flex-1">
                  <Sparkles className="h-4 w-4 mr-2" />
                  AI
                </TabsTrigger>
              </TabsList>

              <TabsContent value="matches" className="space-y-2 mt-4">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading...
                  </div>
                ) : matches.length === 0 ? (
                  <div className="text-center py-8">
                    <Heart className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No matches yet</p>
                  </div>
                ) : (
                  matches.map((match) => {
                    const unreadCount = match.user_id_1 === match.profile.id 
                      ? match.unread_count_2 
                      : match.unread_count_1;

                    return (
                      <div
                        key={match.id}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedMatch === match.id 
                            ? 'bg-primary/10 border border-primary/30' 
                            : 'hover:bg-accent/50'
                        }`}
                        onClick={() => setSelectedMatch(match.id)}
                      >
                        <Avatar>
                          <AvatarImage
                            src={match.profile.avatar_url || ''}
                            alt={match.profile.display_name || 'User'}
                          />
                          <AvatarFallback>
                            {match.profile.display_name?.[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate text-sm">
                              {match.profile.display_name || 'Anonymous'}
                            </p>
                            {unreadCount > 0 && (
                              <Badge variant="default" className="text-xs h-5">
                                {unreadCount}
                              </Badge>
                            )}
                          </div>
                          {match.last_message_at && (
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(match.last_message_at), { addSuffix: true })}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </TabsContent>

              <TabsContent value="ai" className="mt-4">
                <div className="text-center py-8">
                  <Sparkles className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    AI companion chats coming soon
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <div className="lg:col-span-2">
          {selectedMatch && selectedMatchData ? (
            <MatchChat
              matchId={selectedMatch}
              otherUser={selectedMatchData.profile}
            />
          ) : (
            <Card className="bg-card/50 border-border/50 h-[600px] flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">Select a Match</h3>
                <p className="text-muted-foreground">
                  Choose a match to start chatting
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
