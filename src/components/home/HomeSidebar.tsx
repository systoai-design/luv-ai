import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { calculateMatchScore } from "@/lib/interests";
import { useNavigate } from "react-router-dom";
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

  useEffect(() => {
    if (currentUserInterests.length === 0) {
      setLoading(false);
      return;
    }

    loadSuggestedUsers();
  }, [currentUserInterests, userId]);

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

  const handleUserClick = (userIdToView: string) => {
    navigate(`/profile/${userIdToView}`);
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
                  onClick={() => handleUserClick(profile.user_id)}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent/50 cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={profile.avatar_url} alt={profile.display_name} />
                    <AvatarFallback>
                      {profile.display_name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 space-y-1">
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
    </div>
  );
};
