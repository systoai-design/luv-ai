import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { User, FileText, Sparkles } from "lucide-react";

interface SearchResultsProps {
  users: any[];
  posts: any[];
  companions: any[];
  onClose: () => void;
}

const SearchResults = ({ users, posts, companions, onClose }: SearchResultsProps) => {
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  const hasResults = users.length > 0 || posts.length > 0 || companions.length > 0;

  if (!hasResults) {
    return (
      <Card className="absolute top-full mt-2 w-full max-h-96 overflow-hidden z-50 bg-card border-border/50">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground text-center">No results found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="absolute top-full mt-2 w-full max-h-96 overflow-y-auto z-50 bg-card border-border/50 shadow-lg">
      <CardContent className="p-0">
        {/* Users */}
        {users.length > 0 && (
          <div className="p-2">
            <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground">
              <User className="h-3 w-3" />
              USERS
            </div>
            {users.map((user) => (
              <div
                key={user.user_id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => handleNavigate(`/profile/${user.username}`)}
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
            <Separator className="my-2" />
          </div>
        )}

        {/* Posts */}
        {posts.length > 0 && (
          <div className="p-2">
            <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground">
              <FileText className="h-3 w-3" />
              POSTS
            </div>
            {posts.map((post) => (
              <div
                key={post.id}
                className="p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => handleNavigate('/home')}
              >
                <p className="text-sm line-clamp-2">{post.content}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  by @{post.profiles?.username}
                </p>
              </div>
            ))}
            <Separator className="my-2" />
          </div>
        )}

        {/* AI Companions */}
        {companions.length > 0 && (
          <div className="p-2">
            <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground">
              <Sparkles className="h-3 w-3" />
              AI COMPANIONS
            </div>
            {companions.map((companion) => (
              <div
                key={companion.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => handleNavigate(`/chat/${companion.id}`)}
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
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SearchResults;
