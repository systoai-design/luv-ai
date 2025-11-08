import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Sparkles, TrendingUp, Users, Heart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePresenceDisplay } from "@/hooks/usePresenceDisplay";
import { useMatches } from "@/hooks/useMatches";

const RightSidebar = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [featuredCompanions, setFeaturedCompanions] = useState<any[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [onlineFriends, setOnlineFriends] = useState<any[]>([]);
  const { matches } = useMatches();
  
  const friendIds = onlineFriends.map(f => f.user_id).filter(Boolean);
  const matchIds = matches.slice(0, 3).map(m => m.profile?.id).filter(Boolean);
  const presenceMap = usePresenceDisplay([...friendIds, ...matchIds]);

  useEffect(() => {
    loadFeaturedCompanions();
    loadSuggestedUsers();
    if (user) {
      loadOnlineFriends();
    }
  }, [user]);

  const loadFeaturedCompanions = async () => {
    try {
      const { data } = await supabase
        .from('ai_companions')
        .select('*')
        .eq('is_active', true)
        .limit(3);

      if (data) {
        setFeaturedCompanions(data);
      }
    } catch (error) {
      console.error('Error loading featured companions:', error);
    }
  };

  const loadSuggestedUsers = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url, bio')
        .limit(5);

      if (data) {
        setSuggestedUsers(data);
      }
    } catch (error) {
      console.error('Error loading suggested users:', error);
    }
  };

  const loadOnlineFriends = async () => {
    try {
      // Load users that the current user follows
      const { data: followingData } = await supabase
        .from('followers')
        .select(`
          following_id,
          profiles:following_id (
            user_id,
            display_name,
            username,
            avatar_url
          )
        `)
        .eq('follower_id', user!.id)
        .limit(5);

      if (followingData) {
        // In a real app, you'd check online status via presence tracking
        // For now, we'll just show the friends list
        setOnlineFriends(followingData.map(f => f.profiles) || []);
      }
    } catch (error) {
      console.error('Error loading online friends:', error);
    }
  };

  return (
    <aside className="hidden xl:flex flex-col w-80 p-4 fixed right-0 top-16 bottom-0 overflow-y-auto space-y-4 bg-background/50 backdrop-blur-xl border-l border-border/50">
      {/* Gradient border highlight */}
      <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-primary/50 to-transparent pointer-events-none" />
      {/* Online Friends */}
      {onlineFriends.length > 0 && (
        <Card className="bg-card/30 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-all shadow-card hover:shadow-glow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Friends Online
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {onlineFriends.map((friend) => {
              const presence = presenceMap[friend.user_id];
              const isOnline = presence?.online || false;
              
              return (
                <div
                  key={friend.user_id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/profile/${friend.username}`)}
                >
                  <div className="relative">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={friend.avatar_url} />
                      <AvatarFallback className="bg-primary/20 text-primary text-xs">
                        {friend.display_name?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute bottom-0 right-0 h-3 w-3 border-2 border-card rounded-full ${
                      isOnline ? 'bg-green-500' : 'bg-muted'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{friend.display_name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {presence?.formattedLastSeen || 'Offline'}
                    </p>
                  </div>
                </div>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2"
              onClick={() => navigate('/friends')}
            >
              See All
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Your Matches */}
      {matches.length > 0 && (
        <Card className="bg-card/30 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-all shadow-card hover:shadow-glow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Heart className="h-4 w-4 text-primary fill-primary" />
              Your Matches
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {matches.slice(0, 3).map((match) => {
              const presence = presenceMap[match.profile?.id];
              const isOnline = presence?.online || false;
              
              return (
                <div
                  key={match.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => navigate('/messages')}
                >
                  <div className="relative">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={match.profile?.avatar_url || ''} />
                      <AvatarFallback className="bg-primary/20 text-primary text-xs">
                        {match.profile?.display_name?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute bottom-0 right-0 h-3 w-3 border-2 border-card rounded-full ${
                      isOnline ? 'bg-green-500' : 'bg-muted'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{match.profile?.display_name || 'Anonymous'}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {presence?.formattedLastSeen || 'Offline'}
                    </p>
                  </div>
                </div>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2"
              onClick={() => navigate('/matches')}
            >
              See All Matches
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Featured Companions */}
      {featuredCompanions.length > 0 && (
        <Card className="bg-card/30 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-all shadow-card hover:shadow-glow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Featured AI Companions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {featuredCompanions.map((companion) => (
              <div
                key={companion.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/chat/${companion.id}`)}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={companion.avatar_url} />
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {companion.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{companion.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{companion.tagline}</p>
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => navigate('/marketplace')}
            >
              View All
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Suggested Friends */}
      {suggestedUsers.length > 0 && (
        <Card className="bg-card/30 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-all shadow-card hover:shadow-glow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Suggested for You
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {suggestedUsers.map((user) => (
              <div
                key={user.user_id}
                className="group p-2 rounded-lg hover:bg-muted/50 transition-all cursor-pointer"
                onClick={() => navigate(`/profile/${user.username}`)}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-transparent group-hover:border-primary/50 transition-all">
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {user.display_name?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{user.display_name}</p>
                    <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                  </div>
                </div>
                {user.bio && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2 ml-13">{user.bio}</p>
                )}
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2 hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={() => navigate('/friends')}
            >
              See All
            </Button>
          </CardContent>
        </Card>
      )}
    </aside>
  );
};

export default RightSidebar;
