import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Users, ArrowRight, Check, UserPlus, ChevronDown, Sparkles, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { calculateMatchScore } from "@/lib/interests";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { EmptyInterestsState } from "./EmptyInterestsState";

interface HomeSidebarProps {
  currentUserInterests: string[];
  userId: string;
}

interface ScoredUser {
  profile: any;
  sharedInterests: string[];
  matchScore: number;
}

export const HomeSidebar = ({ currentUserInterests, userId }: HomeSidebarProps) => {
  const navigate = useNavigate();
  const [suggestedUsers, setSuggestedUsers] = useState<ScoredUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  // Feature 1: New suggestions tracking
  const [previousUserIds, setPreviousUserIds] = useState<string[]>([]);
  const [hasNewSuggestions, setHasNewSuggestions] = useState(false);
  const [newUserCount, setNewUserCount] = useState(0);
  
  // Feature 2: Connect button states
  const [followingStates, setFollowingStates] = useState<Record<string, boolean>>({});
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  
  // Feature 3: Discover More section
  const [trendingInterests, setTrendingInterests] = useState<Array<{ name: string; count: number }>>([]);
  const [popularProfiles, setPopularProfiles] = useState<any[]>([]);
  const [discoverExpanded, setDiscoverExpanded] = useState(false);

  useEffect(() => {
    if (currentUserInterests.length === 0) {
      setLoading(false);
      return;
    }

    loadSuggestedUsers();
    loadDiscoverData();
  }, [currentUserInterests, userId]);

  // Feature 1: Detect new suggestions
  useEffect(() => {
    if (suggestedUsers.length > 0) {
      const currentIds = suggestedUsers.map(u => u.profile.user_id);
      const newUsers = currentIds.filter(id => !previousUserIds.includes(id));
      
      if (newUsers.length > 0 && previousUserIds.length > 0) {
        setHasNewSuggestions(true);
        setNewUserCount(newUsers.length);
        
        // Auto-hide after 5 seconds
        setTimeout(() => setHasNewSuggestions(false), 5000);
      }
      
      setPreviousUserIds(currentIds);
    }
  }, [suggestedUsers]);

  const loadSuggestedUsers = async () => {
    try {
      setLoading(true);
      setError(false);

      // Get users the current user is already following
      const { data: followingData } = await supabase
        .from("followers")
        .select("following_id")
        .eq("follower_id", userId);

      const followingIds = followingData?.map(f => f.following_id) || [];

      // Load profiles with interests
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, display_name, username, avatar_url, interests")
        .neq("user_id", userId)
        .not("interests", "is", null)
        .limit(20);

      if (profilesError) throw profilesError;

      // Score users by shared interests
      const scored = (profiles || [])
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

      setSuggestedUsers(scored);
    } catch (err) {
      console.error("Error loading suggested users:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (username: string) => {
    if (!username) {
      console.warn("Username not available for navigation");
      return;
    }
    navigate(`/profile/${username}`);
  };

  // Feature 2: Connect button handler
  const handleConnect = async (targetUserId: string, username: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    setLoadingStates(prev => ({ ...prev, [targetUserId]: true }));
    
    try {
      const { error } = await supabase
        .from("followers")
        .insert({
          follower_id: userId,
          following_id: targetUserId,
        });

      if (error) throw error;

      setFollowingStates(prev => ({ ...prev, [targetUserId]: true }));
      toast.success(`Connected with @${username}`);
      
      // Remove from suggested users after 1 second
      setTimeout(() => {
        setSuggestedUsers(prev => 
          prev.filter(u => u.profile.user_id !== targetUserId)
        );
      }, 1000);
      
      // Check badges for the followed user
      await supabase.rpc("check_and_award_badges", {
        check_user_id: targetUserId,
      });
      
    } catch (error) {
      console.error("Error connecting:", error);
      toast.error("Failed to connect");
    } finally {
      setLoadingStates(prev => ({ ...prev, [targetUserId]: false }));
    }
  };

  // Feature 3: Load discover data
  const loadDiscoverData = async () => {
    try {
      // Load all profiles with interests
      const { data: profiles } = await supabase
        .from("profiles")
        .select("interests, user_id");
      
      // Count interest frequency
      const interestCounts: Record<string, number> = {};
      profiles?.forEach(profile => {
        profile.interests?.forEach((interest: string) => {
          interestCounts[interest] = (interestCounts[interest] || 0) + 1;
        });
      });
      
      // Get top 5 trending interests
      const trending = Object.entries(interestCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      setTrendingInterests(trending);
      
      // Load popular profiles
      const { data: followCounts } = await supabase
        .from("followers")
        .select("following_id");
      
      const followerCountMap: Record<string, number> = {};
      followCounts?.forEach(f => {
        followerCountMap[f.following_id] = (followerCountMap[f.following_id] || 0) + 1;
      });
      
      const topUserIds = Object.entries(followerCountMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([id]) => id);
      
      if (topUserIds.length > 0) {
        const { data: popularData } = await supabase
          .from("profiles")
          .select("user_id, display_name, username, avatar_url")
          .in("user_id", topUserIds)
          .neq("user_id", userId);
        
        const sorted = (popularData || [])
          .map(p => ({
            ...p,
            followerCount: followerCountMap[p.user_id] || 0
          }))
          .sort((a, b) => b.followerCount - a.followerCount);
        
        setPopularProfiles(sorted);
      }
      
    } catch (error) {
      console.error("Error loading discover data:", error);
    }
  };

  if (currentUserInterests.length === 0) {
    return (
      <div className="hidden xl:block fixed right-8 top-24 w-80 space-y-4">
        <EmptyInterestsState variant="sidebar" userId={userId} />
      </div>
    );
  }

  return (
    <div className="hidden xl:block fixed right-8 top-24 w-80 space-y-4">
      <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-primary" />
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
          {loading ? (
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-3 p-2">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </>
          ) : error ? (
            <div className="text-center py-4 space-y-2">
              <p className="text-sm text-muted-foreground">Unable to load suggestions</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadSuggestedUsers}
              >
                Try Again
              </Button>
            </div>
          ) : suggestedUsers.length === 0 ? (
            <div className="text-center py-6 space-y-2">
              <p className="text-sm text-muted-foreground">No users found with shared interests yet</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate("/discover")}
              >
                Explore Discover
              </Button>
            </div>
          ) : (
            <>
              {suggestedUsers.map(({ profile, sharedInterests, matchScore }) => (
                <div
                  key={profile.user_id}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent/50 transition-all duration-200"
                >
                  <div onClick={() => handleUserClick(profile.username)} className="cursor-pointer">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile.avatar_url} alt={profile.display_name} />
                      <AvatarFallback>
                        {profile.display_name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div 
                    onClick={() => handleUserClick(profile.username)}
                    className="flex-1 min-w-0 space-y-1 cursor-pointer"
                  >
                    <div>
                      <p className="font-semibold text-sm truncate">
                        {profile.display_name || "User"}
                      </p>
                      {profile.username && (
                        <p className="text-xs text-muted-foreground truncate">
                          @{profile.username}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      🎯 {matchScore} shared
                    </Badge>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {sharedInterests.slice(0, 2).map((interest, idx) => (
                        <Badge 
                          key={idx} 
                          variant="outline" 
                          className="text-xs"
                        >
                          {interest}
                        </Badge>
                      ))}
                      {sharedInterests.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{sharedInterests.length - 2}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => handleConnect(profile.user_id, profile.username, e)}
                    disabled={loadingStates[profile.user_id] || followingStates[profile.user_id]}
                    className="shrink-0 h-8"
                  >
                    {followingStates[profile.user_id] ? (
                      <>
                        <Check className="h-3 w-3 mr-1" />
                        Connected
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-3 w-3 mr-1" />
                        Connect
                      </>
                    )}
                  </Button>
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/discover")}
                className="w-full justify-between mt-2"
              >
                See All
                <ArrowRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Feature 3: Discover More Section */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-card">
        <CardHeader 
          className="pb-3 cursor-pointer"
          onClick={() => setDiscoverExpanded(!discoverExpanded)}
        >
          <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Discover More
            </div>
            <ChevronDown 
              className={`h-4 w-4 transition-transform ${discoverExpanded ? 'rotate-180' : ''}`}
            />
          </CardTitle>
        </CardHeader>
        
        {discoverExpanded && (
          <CardContent className="space-y-4">
            {/* Trending Interests */}
            {trendingInterests.length > 0 && (
              <>
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Trending Interests
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {trendingInterests.map((interest) => (
                      <Badge 
                        key={interest.name} 
                        variant="secondary"
                        className="text-xs cursor-pointer hover:bg-primary/20 transition-colors"
                        onClick={() => navigate(`/discover?interest=${interest.name}`)}
                      >
                        {interest.name}
                        <span className="ml-1 text-muted-foreground">({interest.count})</span>
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {popularProfiles.length > 0 && <Separator />}
              </>
            )}
            
            {/* Popular Profiles */}
            {popularProfiles.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Popular Profiles
                </h4>
                <div className="space-y-2">
                  {popularProfiles.map((profile) => (
                    <div
                      key={profile.user_id}
                      onClick={() => handleUserClick(profile.username)}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent/50 cursor-pointer transition-all"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile.avatar_url} />
                        <AvatarFallback>{profile.display_name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{profile.display_name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {profile.followerCount} followers
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/discover")}
              className="w-full"
            >
              Explore All
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
};
