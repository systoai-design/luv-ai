import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { PostCard } from "@/components/posts/PostCard";
import { PostComposer } from "@/components/posts/PostComposer";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

const POSTS_PER_PAGE = 10;

const Home = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [profile, setProfile] = useState<any>(null);
  const observerTarget = useRef(null);

  const loadPosts = async (offset = 0) => {
    if (!user) return;

    try {
      const isInitialLoad = offset === 0;
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      // Load posts from all users (or followed users)
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
        .order("created_at", { ascending: false })
        .range(offset, offset + POSTS_PER_PAGE - 1);

      if (postsError) throw postsError;

      // Load user's likes
      const { data: likesData } = await supabase
        .from("likes")
        .select("post_id")
        .eq("user_id", user.id);

      const likedPostIds = new Set(likesData?.map((l) => l.post_id) || []);
      setUserLikes(likedPostIds);

      if (isInitialLoad) {
        setPosts(postsData || []);
      } else {
        setPosts((prev) => [...prev, ...(postsData || [])]);
      }

      setHasMore((postsData?.length || 0) === POSTS_PER_PAGE);
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadProfile = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      loadPosts(posts.length);
    }
  }, [loadingMore, hasMore, posts.length]);

  useEffect(() => {
    if (user) {
      loadPosts();
      loadProfile();
    }
  }, [user]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [handleLoadMore, hasMore, loadingMore]);

  // Real-time updates for new posts
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("home-posts-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "posts",
        },
        () => {
          loadPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero">
        <Header />
        <div className="container mx-auto px-4 pt-24 pb-12 max-w-2xl">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />
      <div className="container mx-auto px-4 pt-24 pb-12 max-w-2xl">
        <div className="space-y-6">
          {profile && (
            <PostComposer
              userId={user!.id}
              avatarUrl={profile.avatar_url}
              displayName={profile.display_name}
              onPostCreated={() => loadPosts()}
            />
          )}

          {posts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border border-border">
              No posts yet. Start following users to see their posts!
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  profile={post.profiles}
                  currentUserId={user!.id}
                  userLiked={userLikes.has(post.id)}
                  onDelete={() => loadPosts()}
                  onLikeToggle={() => loadPosts()}
                />
              ))}
            </div>
          )}

          {/* Infinite scroll trigger */}
          {hasMore && (
            <div ref={observerTarget} className="flex justify-center py-4">
              {loadingMore && (
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
