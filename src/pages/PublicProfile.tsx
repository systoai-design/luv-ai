import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileStats } from "@/components/profile/ProfileStats";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { ProfileAbout } from "@/components/profile/ProfileAbout";
import { PostFeed } from "@/components/posts/PostFeed";
import { Loader2 } from "lucide-react";

const PublicProfile = () => {
  const { username } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [postsCount, setPostsCount] = useState(0);

  useEffect(() => {
    const loadProfile = async () => {
      if (!username) return;

      try {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("username", username)
          .single();

        if (profileError) throw profileError;

        if (!profileData) {
          navigate("/not-found");
          return;
        }

        // If viewing own profile, redirect to /profile
        if (user && profileData.user_id === user.id) {
          navigate("/profile");
          return;
        }

        setProfile(profileData);

        const { count } = await supabase
          .from("posts")
          .select("*", { count: "exact", head: true })
          .eq("user_id", profileData.user_id);

        setPostsCount(count || 0);
      } catch (error) {
        console.error("Error loading profile:", error);
        navigate("/not-found");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [username, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />
      <div className="container mx-auto px-4 pt-24 pb-12 max-w-4xl">
        <div className="space-y-6">
          <ProfileHeader
            userId={profile.user_id}
            displayName={profile.display_name}
            username={profile.username}
            bio={profile.bio}
            avatarUrl={profile.avatar_url}
            coverPhotoUrl={profile.cover_photo_url}
            verifiedBadgeId={profile.verified_badge_id}
            isOwnProfile={false}
            onAvatarUpdate={() => {}}
            onCoverUpdate={() => {}}
          />

          <ProfileStats postsCount={postsCount} />

          <ProfileTabs
            postsContent={
              user ? (
                <PostFeed userId={profile.user_id} currentUserId={user.id} />
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Please log in to view posts
                </div>
              )
            }
            aboutContent={
              <ProfileAbout
                profile={profile}
                isOwnProfile={false}
              />
            }
          />
        </div>
      </div>
    </div>
  );
};

export default PublicProfile;
