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
export const HomeSidebar = ({
  currentUserInterests,
  userId
}: HomeSidebarProps) => {
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
  const [trendingInterests, setTrendingInterests] = useState<Array<{
    name: string;
    count: number;
  }>>([]);
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
      const {
        data: followingData
      } = await supabase.from("followers").select("following_id").eq("follower_id", userId);
      const followingIds = followingData?.map(f => f.following_id) || [];

      // Load profiles with interests
      const {
        data: profiles,
        error: profilesError
      } = await supabase.from("profiles").select("user_id, display_name, username, avatar_url, interests").neq("user_id", userId).not("interests", "is", null).limit(20);
      if (profilesError) throw profilesError;

      // Score users by shared interests
      const scored = (profiles || []).filter(profile => !followingIds.includes(profile.user_id)).map(profile => {
        const {
          score,
          shared
        } = calculateMatchScore(currentUserInterests, profile.interests || []);
        return {
          profile,
          sharedInterests: shared,
          matchScore: score
        };
      }).filter(scored => scored.matchScore > 0).sort((a, b) => b.matchScore - a.matchScore).slice(0, 5);
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
    setLoadingStates(prev => ({
      ...prev,
      [targetUserId]: true
    }));
    try {
      const {
        error
      } = await supabase.from("followers").insert({
        follower_id: userId,
        following_id: targetUserId
      });
      if (error) throw error;
      setFollowingStates(prev => ({
        ...prev,
        [targetUserId]: true
      }));
      toast.success(`Connected with @${username}`);

      // Remove from suggested users after 1 second
      setTimeout(() => {
        setSuggestedUsers(prev => prev.filter(u => u.profile.user_id !== targetUserId));
      }, 1000);

      // Check badges for the followed user
      await supabase.rpc("check_and_award_badges", {
        check_user_id: targetUserId
      });
    } catch (error) {
      console.error("Error connecting:", error);
      toast.error("Failed to connect");
    } finally {
      setLoadingStates(prev => ({
        ...prev,
        [targetUserId]: false
      }));
    }
  };

  // Feature 3: Load discover data
  const loadDiscoverData = async () => {
    try {
      // Load all profiles with interests
      const {
        data: profiles
      } = await supabase.from("profiles").select("interests, user_id");

      // Count interest frequency
      const interestCounts: Record<string, number> = {};
      profiles?.forEach(profile => {
        profile.interests?.forEach((interest: string) => {
          interestCounts[interest] = (interestCounts[interest] || 0) + 1;
        });
      });

      // Get top 5 trending interests
      const trending = Object.entries(interestCounts).map(([name, count]) => ({
        name,
        count
      })).sort((a, b) => b.count - a.count).slice(0, 5);
      setTrendingInterests(trending);

      // Load popular profiles
      const {
        data: followCounts
      } = await supabase.from("followers").select("following_id");
      const followerCountMap: Record<string, number> = {};
      followCounts?.forEach(f => {
        followerCountMap[f.following_id] = (followerCountMap[f.following_id] || 0) + 1;
      });
      const topUserIds = Object.entries(followerCountMap).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id]) => id);
      if (topUserIds.length > 0) {
        const {
          data: popularData
        } = await supabase.from("profiles").select("user_id, display_name, username, avatar_url").in("user_id", topUserIds).neq("user_id", userId);
        const sorted = (popularData || []).map(p => ({
          ...p,
          followerCount: followerCountMap[p.user_id] || 0
        })).sort((a, b) => b.followerCount - a.followerCount);
        setPopularProfiles(sorted);
      }
    } catch (error) {
      console.error("Error loading discover data:", error);
    }
  };
  if (currentUserInterests.length === 0) {
    return <div className="hidden xl:block sticky top-24 w-80 space-y-4 self-start">
        <EmptyInterestsState variant="sidebar" userId={userId} />
      </div>;
  }
  return <div className="hidden xl:block sticky top-24 w-80 space-y-4 self-start">
      <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-card">
        
        
      </Card>

      {/* Feature 3: Discover More Section */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-card">
        
        
        {discoverExpanded && <CardContent className="space-y-4">
            {/* Trending Interests */}
            {trendingInterests.length > 0 && <>
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Trending Interests
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {trendingInterests.map(interest => <Badge key={interest.name} variant="secondary" className="text-xs cursor-pointer hover:bg-primary/20 transition-colors" onClick={() => navigate(`/discover?interest=${interest.name}`)}>
                        {interest.name}
                        <span className="ml-1 text-muted-foreground">({interest.count})</span>
                      </Badge>)}
                  </div>
                </div>
                
                {popularProfiles.length > 0 && <Separator />}
              </>}
            
            {/* Popular Profiles */}
            {popularProfiles.length > 0 && <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Popular Profiles
                </h4>
                <div className="space-y-2">
                  {popularProfiles.map(profile => <div key={profile.user_id} onClick={() => handleUserClick(profile.username)} className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent/50 cursor-pointer transition-all">
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
                    </div>)}
                </div>
              </div>}
            
            <Button variant="ghost" size="sm" onClick={() => navigate("/discover")} className="w-full">
              Explore All
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>}
      </Card>
    </div>;
};