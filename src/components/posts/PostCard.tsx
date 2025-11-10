import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Trash2, Globe, Users, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { CommentSection } from "./CommentSection";

interface PostCardProps {
  post: {
    id: string;
    user_id: string;
    content?: string | null;
    image_url?: string | null;
    likes_count: number;
    comments_count: number;
    created_at: string;
    visibility?: string;
  };
  profile: {
    display_name?: string;
    avatar_url?: string;
    username?: string;
  };
  currentUserId: string;
  userLiked: boolean;
  sharedInterests?: string[];
  onDelete?: () => void;
  onLikeToggle: () => void;
}

export const PostCard = ({
  post,
  profile,
  currentUserId,
  userLiked,
  sharedInterests = [],
  onDelete,
  onLikeToggle,
}: PostCardProps) => {
  const [showComments, setShowComments] = useState(false);
  const isOwnPost = post.user_id === currentUserId;

  const getVisibilityIcon = () => {
    switch (post.visibility) {
      case "connections":
        return <Users className="h-3 w-3" />;
      case "private":
        return <Lock className="h-3 w-3" />;
      default:
        return <Globe className="h-3 w-3" />;
    }
  };

  const getVisibilityLabel = () => {
    switch (post.visibility) {
      case "connections":
        return "Connections";
      case "private":
        return "Private";
      default:
        return "Public";
    }
  };

  const handleLike = async () => {
    try {
      if (userLiked) {
        await supabase
          .from("likes")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", currentUserId);
      } else {
        await supabase
          .from("likes")
          .insert({ post_id: post.id, user_id: currentUserId });
      }
      onLikeToggle();
    } catch (error) {
      console.error("Error toggling like:", error);
      toast.error("Failed to update like");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      if (post.image_url) {
        const path = post.image_url.split("/").slice(-2).join("/");
        await supabase.storage.from("post-images").remove([path]);
      }

      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", post.id);

      if (error) throw error;

      toast.success("Post deleted");
      onDelete?.();
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    }
  };

  return (
    <Card variant="glass" className="hover:border-primary/30 transition-all duration-300 shadow-card hover:shadow-glow hover:scale-[1.01]">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile.avatar_url} alt={profile.display_name || "User"} />
              <AvatarFallback>
                {profile.display_name?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>

            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold">{profile.display_name || "User"}</p>
                {sharedInterests.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    🎯 {sharedInterests.length} shared
                  </Badge>
                )}
              </div>
              {profile.username && (
                <p className="text-sm text-muted-foreground">@{profile.username}</p>
              )}
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </p>
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  {getVisibilityIcon()}
                  {getVisibilityLabel()}
                </Badge>
              </div>
            </div>
          </div>

          {isOwnPost && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {post.content && (
          <p className="mb-4 whitespace-pre-wrap">{post.content}</p>
        )}

        {post.image_url && (
          <img
            src={post.image_url}
            alt="Post"
            className="rounded-lg w-full mb-4"
          />
        )}

        <div className="flex items-center gap-4 pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className="gap-2 hover:scale-110 transition-transform duration-200"
          >
            <Heart className={`h-4 w-4 transition-all ${userLiked ? "fill-red-500 text-red-500 animate-pulse" : ""}`} />
            <span>{post.likes_count}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className="gap-2 hover:scale-110 transition-transform duration-200"
          >
            <MessageCircle className="h-4 w-4" />
            <span>{post.comments_count}</span>
          </Button>
        </div>

        {showComments && (
          <CommentSection
            postId={post.id}
            currentUserId={currentUserId}
          />
        )}
      </CardContent>
    </Card>
  );
};
