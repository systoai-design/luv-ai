import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PostCard } from "@/components/posts/PostCard";
import { PostComposer } from "@/components/posts/PostComposer";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import { calculateMatchScore } from "@/lib/interests";
import { HomeSidebar } from "@/components/home/HomeSidebar";
import { EmptyInterestsState } from "@/components/home/EmptyInterestsState";
const POSTS_PER_PAGE = 10;
const Home = () => {
  const {
    user
  } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [profile, setProfile] = useState<any>(null);
  const [currentUserInterests, setCurrentUserInterests] = useState<string[]>([]);
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

      // First get posts
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false })
        .range(offset, offset + POSTS_PER_PAGE - 1);
      
      if (postsError) throw postsError;

      // Then get profiles for those posts
      let postsWithProfiles: any[] = [];
      if (postsData && postsData.length > 0) {
        const userIds = [...new Set(postsData.map(p => p.user_id))];
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, display_name, avatar_url, username, interests")
          .in("user_id", userIds);

        // Merge profiles into posts
        postsWithProfiles = postsData.map(post => ({
          ...post,
          profiles: profilesData?.find(p => p.user_id === post.user_id) || null
        }));
      }

      // Load user's likes
      const {
        data: likesData
      } = await supabase.from("likes").select("post_id").eq("user_id", user.id);
      const likedPostIds = new Set(likesData?.map(l => l.post_id) || []);
      setUserLikes(likedPostIds);

      // Score and sort posts by shared interests
      const scoredPosts = postsWithProfiles.map((post: any) => {
        const authorInterests = post.profiles?.interests || [];
        const {
          score: sharedCount,
          shared
        } = calculateMatchScore(currentUserInterests, authorInterests);
        return {
          ...post,
          sharedInterests: shared,
          interestScore: sharedCount
        };
      });

      // Sort: High interest match first, then medium, then low, within each group by date
      scoredPosts.sort((a, b) => {
        if (a.interestScore !== b.interestScore) {
          return b.interestScore - a.interestScore; // Higher score first
        }
        // Within same score group, sort by date (most recent first)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      if (isInitialLoad) {
        setPosts(scoredPosts);
      } else {
        setPosts(prev => [...prev, ...scoredPosts]);
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
      const {
        data
      } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
      if (data) {
        setProfile(data);
        setCurrentUserInterests(data.interests || []);
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

  // Subscribe to new posts for real-time updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('home-posts-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
        },
        (payload) => {
          console.log("Home: New post created:", payload);
          loadPosts(0); // Refresh feed
        }
      )
      .subscribe((status) => {
        console.log("Home: Realtime subscription status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, currentUserInterests]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) {
        handleLoadMore();
      }
    }, {
      threshold: 0.1
    });
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
    const channel = supabase.channel("home-posts-changes").on("postgres_changes", {
      event: "INSERT",
      schema: "public",
      table: "posts"
    }, () => {
      loadPosts();
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
  if (loading) {
    return <div className="container mx-auto px-4 py-4 md:py-8 max-w-2xl">
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      </div>;
  }
  return <div className="container mx-auto px-4 py-4 md:py-8 relative">
      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
      
      <div className="flex gap-8 relative z-10">
        {/* Main Feed */}
        <div className="flex-1 max-w-2xl mx-auto space-y-6 animate-fade-in">
          {/* Interest prompt - show if no interests but don't hide posts */}
          {currentUserInterests.length === 0 && (
            <EmptyInterestsState userId={user!.id} />
          )}

          {profile && <PostComposer userId={user!.id} avatarUrl={profile.avatar_url} displayName={profile.display_name} onPostCreated={() => loadPosts()} />}

          {posts.length === 0 && !loading ? (
            <div className="text-center py-12 text-muted-foreground bg-card/30 backdrop-blur-sm rounded-lg border border-border/50 shadow-card">
              <p className="text-lg font-medium mb-2">No posts yet</p>
              <p className="text-sm">Be the first to share something!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post: any) => <PostCard key={post.id} post={post} profile={post.profiles} currentUserId={user!.id} userLiked={userLikes.has(post.id)} sharedInterests={post.sharedInterests || []} onDelete={() => loadPosts()} onLikeToggle={() => loadPosts()} />)}
            </div>
          )}

          {/* Infinite scroll trigger */}
          {hasMore && <div ref={observerTarget} className="flex justify-center py-4">
              {loadingMore && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
            </div>}
        </div>

        {/* Right Sidebar */}
        
      </div>
    </div>;
};
export default Home;