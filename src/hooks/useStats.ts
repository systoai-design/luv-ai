import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Stats {
  activeUsers: number;
  matchesMade: number;
  messagesPerDay: number;
  encryptedChats: number;
}

export const useStats = () => {
  const [stats, setStats] = useState<Stats>({
    activeUsers: 0,
    matchesMade: 0,
    messagesPerDay: 0,
    encryptedChats: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        // Fetch all stats in parallel
        const [profilesResult, matchesResult, messagesResult, chatsResult] = await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("matches").select("*", { count: "exact", head: true }),
          supabase
            .from("user_messages")
            .select("*", { count: "exact", head: true })
            .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
          supabase.from("user_chats").select("*", { count: "exact", head: true }),
        ]);

        setStats({
          activeUsers: profilesResult.count || 0,
          matchesMade: matchesResult.count || 0,
          messagesPerDay: messagesResult.count || 0,
          encryptedChats: chatsResult.count || 0,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading };
};
