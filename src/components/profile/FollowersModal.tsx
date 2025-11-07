import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

interface FollowersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  defaultTab?: "followers" | "following";
}

export const FollowersModal = ({
  open,
  onOpenChange,
  userId,
  defaultTab = "followers",
}: FollowersModalProps) => {
  const navigate = useNavigate();
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      loadFollowers();
      loadFollowing();
    }
  }, [open, userId]);

  const loadFollowers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("followers")
        .select(`
          follower_id,
          profiles:follower_id (
            user_id,
            display_name,
            username,
            avatar_url
          )
        `)
        .eq("following_id", userId);

      if (error) throw error;
      setFollowers(data || []);
    } catch (error) {
      console.error("Error loading followers:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadFollowing = async () => {
    try {
      const { data, error } = await supabase
        .from("followers")
        .select(`
          following_id,
          profiles:following_id (
            user_id,
            display_name,
            username,
            avatar_url
          )
        `)
        .eq("follower_id", userId);

      if (error) throw error;
      setFollowing(data || []);
    } catch (error) {
      console.error("Error loading following:", error);
    }
  };

  const handleProfileClick = (username: string) => {
    onOpenChange(false);
    navigate(`/profile/${username}`);
  };

  const UserList = ({ users }: { users: any[] }) => {
    if (loading) {
      return (
        <div className="space-y-4 p-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (users.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No users found
        </div>
      );
    }

    return (
      <ScrollArea className="h-[400px]">
        <div className="space-y-2 p-4">
          {users.map((user) => {
            const profile = user.profiles;
            if (!profile) return null;

            return (
              <div
                key={profile.user_id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                onClick={() => handleProfileClick(profile.username)}
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback>
                    {profile.display_name?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold">{profile.display_name || "User"}</div>
                  {profile.username && (
                    <div className="text-sm text-muted-foreground">
                      @{profile.username}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Connections</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="followers">
              Followers ({followers.length})
            </TabsTrigger>
            <TabsTrigger value="following">
              Following ({following.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="followers">
            <UserList users={followers} />
          </TabsContent>
          <TabsContent value="following">
            <UserList users={following} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
