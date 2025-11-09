import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Sparkles, TrendingUp, Users, Heart, Check, UserPlus, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePresenceDisplay } from "@/hooks/usePresenceDisplay";
import { useMatches } from "@/hooks/useMatches";
import { calculateMatchScore } from "@/lib/interests";
import { toast } from "sonner";

const RightSidebar = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [featuredCompanions, setFeaturedCompanions] = useState<any[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [onlineFriends, setOnlineFriends] = useState<any[]>([]);
  const { matches } = useMatches();
  const [currentUserInterests, setCurrentUserInterests] = useState<string[]>([]);
  const [scoredUsers, setScoredUsers] = useState<Array<{
    profile: any;
    sharedInterests: string[];
    matchScore: number;
  }>>([]);
  const [followingStates, setFollowingStates] = useState<Record<string, boolean>>({});
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [hasNewSuggestions, setHasNewSuggestions] = useState(false);
  const [newUserCount, setNewUserCount] = useState(0);
  const [previousUserIds, setPreviousUserIds] = useState<string[]>([]);
  
  const friendIds = onlineFriends.map(f => f.user_id).filter(Boolean);
  const matchIds = matches.slice(0, 3).map(m => m.profile?.id).filter(Boolean);
  const presenceMap = usePresenceDisplay([...friendIds, ...matchIds]);

  useEffect(() => {
    loadFeaturedCompanions();
    if (user) {
      loadCurrentUserInterests();
      loadOnlineFriends();
    }
  }, [user]);

  useEffect(() => {
    if (currentUserInterests.length > 0) {
      loadSuggestedUsers();
    }
  }, [currentUserInterests, user]);

  useEffect(() => {
    if (scoredUsers.length > 0) {
      const currentIds = scoredUsers.map(u => u.profile.user_id);
      const newUsers = currentIds.filter(id => !previousUserIds.includes(id));
      
      if (newUsers.length > 0 && previousUserIds.length > 0) {
        setHasNewSuggestions(true);
        setNewUserCount(newUsers.length);
        
        setTimeout(() => setHasNewSuggestions(false), 5000);
      }
      
      setPreviousUserIds(currentIds);
    }
  }, [scoredUsers]);

  const loadCurrentUserInterests = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('profiles')
        .select('interests')
        .eq('user_id', user.id)
        .single();
      
      if (data?.interests) {
        setCurrentUserInterests(data.interests);
      }
    } catch (error) {
      console.error('Error loading user interests:', error);
    }
  };

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
    if (!user || currentUserInterests.length === 0) return;
    
    try {
      // Get users the current user is already following
      const { data: followingData } = await supabase
        .from("followers")
        .select("following_id")
        .eq("follower_id", user.id);

      const followingIds = followingData?.map(f => f.following_id) || [];

      // Load profiles with interests
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, username, avatar_url, interests")
        .neq("user_id", user.id)
        .not("interests", "is", null)
        .limit(20);

      if (profiles) {
        // Score users by shared interests
        const scored = profiles
          .filter(profile => !followingIds.includes(profile.user_id))
          .map(profile => {
            const { score, shared } = calculateMatchScore(
              currentUserInterests,
              profile.interests || []
            );
            return {
              profile,
              sharedInterests: shared,
              matchScore: score,
            };
          })
          .filter(scored => scored.matchScore > 0)
          .sort((a, b) => b.matchScore - a.matchScore)
          .slice(0, 5);

        setScoredUsers(scored);
      }
    } catch (error) {
      console.error('Error loading suggested users:', error);
    }
  };

  const handleConnect = async (targetUserId: string, username: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) return;
    
    setLoadingStates(prev => ({ ...prev, [targetUserId]: true }));
    
    try {
      // Create a LIKE swipe
      const { error: swipeError } = await supabase
        .from("swipes")
        .insert({
          user_id: user.id,
          target_user_id: targetUserId,
          action: 'like'
        });

      if (swipeError) throw swipeError;

      // Check if they liked us back (mutual like = match)
      const { data: reciprocalSwipe } = await supabase
        .from("swipes")
        .select("*")
        .eq("user_id", targetUserId)
        .eq("target_user_id", user.id)
        .in("action", ["like", "super_like"])
        .maybeSingle();

      if (reciprocalSwipe) {
        // Create match
        const user_id_1 = user.id < targetUserId ? user.id : targetUserId;
        const user_id_2 = user.id > targetUserId ? user.id : targetUserId;
        
        await supabase.from("matches").insert({
          user_id_1,
          user_id_2
        });
        
        toast.success(`🎉 It's a Match with @${username}!`);
      } else {
        toast.success(`Liked @${username}`);
      }

      setFollowingStates(prev => ({ ...prev, [targetUserId]: true }));
      
      // Remove from suggestions after 1 second
      setTimeout(() => {
        setScoredUsers(prev => 
          prev.filter(u => u.profile.user_id !== targetUserId)
        );
      }, 1000);
      
      // Award badges
      await supabase.rpc("check_and_award_badges", {
        check_user_id: targetUserId,
      });
      
    } catch (error) {
      console.error("Error liking user:", error);
      toast.error("Failed to like user");
    } finally {
      setLoadingStates(prev => ({ ...prev, [targetUserId]: false }));
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

      {/* Suggested for You */}
      {scoredUsers.length > 0 && (
        <Card className="bg-card/30 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-all shadow-card hover:shadow-glow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Suggested for You
              {hasNewSuggestions && (
                <Badge 
                  variant="default" 
                  className="animate-pulse bg-primary text-xs ml-auto"
                >
                  {newUserCount} New
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {scoredUsers.map(({ profile, sharedInterests, matchScore }) => (
              <div
                key={profile.user_id}
                className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-muted/50 transition-all group"
              >
                <div 
                  onClick={() => navigate(`/profile/${profile.username}`)}
                  className="cursor-pointer shrink-0"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={profile.avatar_url} />
                    <AvatarFallback className="bg-primary/20 text-primary text-xs">
                      {profile.display_name?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                <div 
                  onClick={() => navigate(`/profile/${profile.username}`)}
                  className="flex-1 min-w-0 cursor-pointer space-y-1"
                >
                  <p className="text-sm font-medium truncate">{profile.display_name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    @{profile.username}
                  </p>
                  
                  <div className="space-y-1">
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      🎯 {matchScore} shared
                    </Badge>
                    
                    <div className="flex flex-wrap gap-1">
                      {sharedInterests.slice(0, 2).map((interest, idx) => (
                        <Badge key={idx} variant="outline" className="text-[10px] px-1.5 py-0">
                          {interest}
                        </Badge>
                      ))}
                      {sharedInterests.length > 2 && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          +{sharedInterests.length - 2}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => handleConnect(profile.user_id, profile.username, e)}
                  disabled={loadingStates[profile.user_id] || followingStates[profile.user_id]}
                  className="shrink-0 h-7 px-2 text-[11px] opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {followingStates[profile.user_id] ? (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Liked
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-3 w-3 mr-1" />
                      Like
                    </>
                  )}
                </Button>
              </div>
            ))}
            
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2 hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={() => navigate('/discover')}
            >
              See All
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}
    </aside>
  );
};

export default RightSidebar;
