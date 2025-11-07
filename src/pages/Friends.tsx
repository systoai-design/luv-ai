import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Users, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

const Friends = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadConnections();
    }
  }, [user]);

  const loadConnections = async () => {
    if (!user) return;

    try {
      // Load followers
      const { data: followersData } = await supabase
        .from('followers')
        .select(`
          follower_id,
          profiles:follower_id (
            user_id,
            display_name,
            username,
            avatar_url,
            bio
          )
        `)
        .eq('following_id', user.id);

      // Load following
      const { data: followingData } = await supabase
        .from('followers')
        .select(`
          following_id,
          profiles:following_id (
            user_id,
            display_name,
            username,
            avatar_url,
            bio
          )
        `)
        .eq('follower_id', user.id);

      setFollowers(followersData?.map(f => f.profiles) || []);
      setFollowing(followingData?.map(f => f.profiles) || []);
    } catch (error) {
      console.error('Error loading connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const UserCard = ({ user }: { user: any }) => (
    <div className="flex items-center gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors">
      <Avatar className="h-12 w-12 cursor-pointer" onClick={() => navigate(`/profile/${user.username}`)}>
        <AvatarImage src={user.avatar_url} />
        <AvatarFallback className="bg-primary/20 text-primary">
          {user.display_name?.[0]?.toUpperCase() || 'U'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p 
          className="font-medium cursor-pointer hover:text-primary transition-colors truncate"
          onClick={() => navigate(`/profile/${user.username}`)}
        >
          {user.display_name}
        </p>
        <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
        {user.bio && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{user.bio}</p>
        )}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate(`/profile/${user.username}`)}
      >
        View Profile
      </Button>
    </div>
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl lg:pl-64 xl:pr-80">
        <Skeleton className="h-10 w-48 mb-6" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl lg:pl-64 xl:pr-80">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <Users className="h-8 w-8 text-primary" />
        Friends & Connections
      </h1>

      <Tabs defaultValue="following" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="following">
            Following ({following.length})
          </TabsTrigger>
          <TabsTrigger value="followers">
            Followers ({followers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="following">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">People You Follow</CardTitle>
            </CardHeader>
            <CardContent>
              {following.length === 0 ? (
                <div className="text-center py-12">
                  <UserPlus className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">Not Following Anyone Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Discover and connect with interesting people
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {following.map((user) => (
                    <UserCard key={user.user_id} user={user} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="followers">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Your Followers</CardTitle>
            </CardHeader>
            <CardContent>
              {followers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No Followers Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Share your profile to gain followers
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {followers.map((user) => (
                    <UserCard key={user.user_id} user={user} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Friends;
