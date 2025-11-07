import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";

const RightSidebar = () => {
  const navigate = useNavigate();
  const [featuredCompanions, setFeaturedCompanions] = useState<any[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);

  useEffect(() => {
    loadFeaturedCompanions();
    loadSuggestedUsers();
  }, []);

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
    try {
      const { data } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url')
        .limit(5);

      if (data) {
        setSuggestedUsers(data);
      }
    } catch (error) {
      console.error('Error loading suggested users:', error);
    }
  };

  return (
    <aside className="hidden xl:flex flex-col w-80 p-4 fixed right-0 top-16 bottom-0 overflow-y-auto space-y-4">
      {/* Featured Companions */}
      {featuredCompanions.length > 0 && (
        <Card className="bg-card/50 border-border/50">
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

      {/* Suggested Friends */}
      {suggestedUsers.length > 0 && (
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Suggested for You</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {suggestedUsers.map((user) => (
              <div
                key={user.user_id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/profile/${user.username}`)}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatar_url} />
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {user.display_name?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.display_name}</p>
                  <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => navigate('/friends')}
            >
              See All
            </Button>
          </CardContent>
        </Card>
      )}
    </aside>
  );
};

export default RightSidebar;
