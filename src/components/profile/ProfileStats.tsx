import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface ProfileStatsProps {
  userId: string;
  postsCount: number;
  onFollowersClick: () => void;
  onFollowingClick: () => void;
}

export const ProfileStats = ({ 
  userId, 
  postsCount,
  onFollowersClick,
  onFollowingClick 
}: ProfileStatsProps) => {
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    loadCounts();

    // Real-time updates
    const channel = supabase
      .channel("followers-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "followers",
          filter: `follower_id=eq.${userId},following_id=eq.${userId}`,
        },
        () => {
          loadCounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const loadCounts = async () => {
    try {
      // Get followers count
      const { count: followers } = await supabase
        .from("followers")
        .select("*", { count: "exact", head: true })
        .eq("following_id", userId);

      // Get following count
      const { count: following } = await supabase
        .from("followers")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", userId);

      setFollowersCount(followers || 0);
      setFollowingCount(following || 0);
    } catch (error) {
      console.error("Error loading counts:", error);
    }
  };

  return (
    <div className="border-t border-b border-border py-3 px-6 bg-card">
      <div className="flex gap-6">
        <div className="text-center">
          <div className="text-xl font-bold text-foreground">{postsCount}</div>
          <div className="text-sm text-muted-foreground">Posts</div>
        </div>
        
        <Button
          variant="ghost"
          onClick={onFollowersClick}
          className="text-center p-0 h-auto hover:bg-transparent"
        >
          <div>
            <div className="text-xl font-bold text-foreground">{followersCount}</div>
            <div className="text-sm text-muted-foreground">Followers</div>
          </div>
        </Button>
        
        <Button
          variant="ghost"
          onClick={onFollowingClick}
          className="text-center p-0 h-auto hover:bg-transparent"
        >
          <div>
            <div className="text-xl font-bold text-foreground">{followingCount}</div>
            <div className="text-sm text-muted-foreground">Following</div>
          </div>
        </Button>
      </div>
    </div>
  );
};
