import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileStats } from "@/components/profile/ProfileStats";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { ProfileAbout } from "@/components/profile/ProfileAbout";
import { ProfileIntro } from "@/components/profile/ProfileIntro";
import { ProfileBadges } from "@/components/profile/ProfileBadges";
import { PostFeed } from "@/components/posts/PostFeed";
import { FollowersModal } from "@/components/profile/FollowersModal";
import { Loader2 } from "lucide-react";
import { useUserBadges } from "@/hooks/useUserBadges";

const PublicProfile = () => {
  const { username } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [postsCount, setPostsCount] = useState(0);
  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [followersModalTab, setFollowersModalTab] = useState<"followers" | "following">("followers");
  
  const { badges } = useUserBadges(profile?.user_id);

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
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-6">
          <ProfileHeader
            userId={profile.user_id}
            displayName={profile.display_name}
            username={profile.username}
            avatarUrl={profile.avatar_url}
            coverPhotoUrl={profile.cover_photo_url}
            verifiedBadgeId={profile.verified_badge_id}
            isOwnProfile={false}
            currentUserId={user?.id}
            onAvatarUpdate={() => {}}
            onCoverUpdate={() => {}}
          />

          <ProfileStats 
            userId={profile.user_id}
            postsCount={postsCount}
            onFollowersClick={() => {
              setFollowersModalTab("followers");
              setFollowersModalOpen(true);
            }}
            onFollowingClick={() => {
              setFollowersModalTab("following");
              setFollowersModalOpen(true);
            }}
          />

          <ProfileTabs
            postsContent={
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                  <ProfileIntro
                    bio={profile.bio}
                    walletAddress={profile.wallet_address}
                    interests={profile.interests}
                  />
                  <ProfileBadges badges={badges} />
                </div>
                <div className="lg:col-span-2">
                  {user ? (
                    <PostFeed userId={profile.user_id} currentUserId={user.id} />
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      Please log in to view posts
                    </div>
                  )}
                </div>
              </div>
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

      <FollowersModal
        open={followersModalOpen}
        onOpenChange={setFollowersModalOpen}
        userId={profile.user_id}
        defaultTab={followersModalTab}
      />
    </>
  );
};

export default PublicProfile;
