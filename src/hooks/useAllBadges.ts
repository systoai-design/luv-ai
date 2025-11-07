import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  badge_type: string;
  color: string;
  criteria: any;
}

interface BadgeWithProgress extends Badge {
  earned: boolean;
  earned_at?: string;
  progress: number;
  current: number;
  target: number;
}

export const useAllBadges = () => {
  const { user } = useAuth();

  const { data: badgesWithProgress = [], isLoading } = useQuery({
    queryKey: ["all-badges", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Fetch all badges
      const { data: badges, error: badgesError } = await supabase
        .from("badges")
        .select("*")
        .order("name");

      if (badgesError) throw badgesError;

      // Fetch user's earned badges
      const { data: userBadges, error: userBadgesError } = await supabase
        .from("user_badges")
        .select("badge_id, earned_at")
        .eq("user_id", user.id);

      if (userBadgesError) throw userBadgesError;

      // Fetch user stats for progress calculation
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, bio, avatar_url, interests, can_create_companion")
        .eq("user_id", user.id)
        .single();

      const { count: postsCount } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      const { count: followersCount } = await supabase
        .from("followers")
        .select("*", { count: "exact", head: true })
        .eq("following_id", user.id);

      // Calculate progress for each badge
      const earnedBadgeIds = new Set(userBadges?.map((ub) => ub.badge_id) || []);

      return badges.map((badge: Badge) => {
        const earned = earnedBadgeIds.has(badge.id);
        const earnedBadge = userBadges?.find((ub) => ub.badge_id === badge.id);
        
        let current = 0;
        let target = badge.criteria.value || 1;

        // Calculate current progress based on criteria type
        switch (badge.criteria.type) {
          case "posts_count":
            current = postsCount || 0;
            break;
          case "followers_count":
            current = followersCount || 0;
            break;
          case "verified_creator":
            current = profile?.can_create_companion ? 1 : 0;
            target = 1;
            break;
          case "profile_complete":
            const completionFields = [
              profile?.display_name,
              profile?.bio,
              profile?.avatar_url,
              profile?.interests?.length >= 3,
            ];
            current = completionFields.filter(Boolean).length;
            target = completionFields.length;
            break;
          default:
            current = earned ? 1 : 0;
            target = 1;
        }

        const progress = Math.min((current / target) * 100, 100);

        return {
          ...badge,
          earned,
          earned_at: earnedBadge?.earned_at,
          progress,
          current,
          target,
        } as BadgeWithProgress;
      });
    },
    enabled: !!user,
  });

  return {
    badges: badgesWithProgress,
    isLoading,
  };
};
