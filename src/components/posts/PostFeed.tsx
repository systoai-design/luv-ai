import { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PostCard } from "./PostCard";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface PostFeedProps {
  userId: string;
  currentUserId: string;
}

export interface PostFeedRef {
  refresh: () => void;
}

export const PostFeed = forwardRef<PostFeedRef, PostFeedProps>(
  ({ userId, currentUserId }, ref) => {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [userLikes, setUserLikes] = useState<Set<string>>(new Set());

  const loadPosts = async () => {
    try {
      console.log("PostFeed: Loading posts for userId:", userId);
      
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select(`
          *,
          profiles:user_id (
            display_name,
            avatar_url,
            username
          )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (postsError) {
        console.error("PostFeed error:", postsError);
        toast.error("Failed to load posts");
        throw postsError;
      }

      console.log("PostFeed: Posts loaded:", postsData?.length || 0);

        const { data: likesData } = await supabase
          .from("likes")
          .select("post_id")
          .eq("user_id", currentUserId);

        const likedPostIds = new Set(likesData?.map((l) => l.post_id) || []);
        setUserLikes(likedPostIds);
        setPosts(postsData || []);
      } catch (error) {
        console.error("Error loading posts:", error);
      } finally {
        setLoading(false);
      }
    };

    useImperativeHandle(ref, () => ({
      refresh: loadPosts,
    }));

    useEffect(() => {
      loadPosts();

      const channel = supabase
        .channel(`posts-changes-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "posts",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            console.log("PostFeed: Realtime post change:", payload);
            loadPosts();
          }
        )
        .subscribe((status) => {
          console.log("PostFeed: Realtime subscription status:", status);
        });

      return () => {
        supabase.removeChannel(channel);
      };
    }, [userId, currentUserId]);

    if (loading) {
      return (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      );
    }

    if (posts.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          No posts yet
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            profile={post.profiles}
            currentUserId={currentUserId}
            userLiked={userLikes.has(post.id)}
            onDelete={loadPosts}
            onLikeToggle={loadPosts}
          />
        ))}
      </div>
    );
  }
);
