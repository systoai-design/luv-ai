import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  badge_type: string;
  color: string;
  earned_at?: string;
}

export const useUserBadges = (userId?: string) => {
  const queryClient = useQueryClient();

  const { data: badges = [], isLoading } = useQuery({
    queryKey: ["user-badges", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("user_badges")
        .select(`
          earned_at,
          badges:badge_id (
            id,
            name,
            description,
            icon,
            badge_type,
            color
          )
        `)
        .eq("user_id", userId)
        .order("earned_at", { ascending: false });

      if (error) throw error;

      return data.map((item: any) => ({
        ...item.badges,
        earned_at: item.earned_at,
      })) as Badge[];
    },
    enabled: !!userId,
  });

  const checkBadgesMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.rpc("check_and_award_badges", {
        check_user_id: userId,
      });

      if (error) throw error;
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ["user-badges", userId] });
    },
    onError: (error) => {
      console.error("Error checking badges:", error);
    },
  });

  const checkBadges = (userId: string) => {
    checkBadgesMutation.mutate(userId);
  };

  return {
    badges,
    isLoading,
    checkBadges,
    totalBadges: badges.length,
  };
};
