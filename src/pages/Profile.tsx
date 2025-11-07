import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@solana/wallet-adapter-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileStats } from "@/components/profile/ProfileStats";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { ProfileAbout } from "@/components/profile/ProfileAbout";
import { ProfileIntro } from "@/components/profile/ProfileIntro";
import { ProfileCompletion } from "@/components/profile/ProfileCompletion";
import { ProfileBadges } from "@/components/profile/ProfileBadges";
import { PostComposer } from "@/components/posts/PostComposer";
import { PostFeed } from "@/components/posts/PostFeed";
import { FollowersModal } from "@/components/profile/FollowersModal";
import { useUserBadges } from "@/hooks/useUserBadges";

const Profile = () => {
  const { user } = useAuth();
  const { publicKey, connected } = useWallet();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [postsCount, setPostsCount] = useState(0);
  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [followersModalTab, setFollowersModalTab] = useState<"followers" | "following">("followers");
  const [activeTab, setActiveTab] = useState<"posts" | "about">("posts");
  const [profile, setProfile] = useState({
    username: "",
    display_name: "",
    bio: "",
    wallet_address: "",
    avatar_url: "",
    cover_photo_url: "",
    verified_badge_id: null,
    interests: [] as string[],
  });

  const { badges, checkBadges } = useUserBadges(user?.id);

  const handleFieldClick = (field: string) => {
    // Switch to about tab for editable fields
    if (["display_name", "bio", "interests"].includes(field)) {
      setActiveTab("about");
      // Scroll to top after a brief delay to allow tab transition
      setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 100);
    }
    // For avatar/cover, these are clickable on the header
    // For wallet, user needs to connect wallet via wallet button
  };

  useEffect(() => {
    if (user) {
      loadProfile();
      // Check for new badges when profile loads
      checkBadges(user.id);
    }
  }, [user]);

  useEffect(() => {
    if (connected && publicKey && user) {
      updateWalletAddress(publicKey.toBase58());
    }
  }, [connected, publicKey, user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile({
          username: (data as any).username || "",
          display_name: data.display_name || "",
          bio: data.bio || "",
          wallet_address: data.wallet_address || "",
          avatar_url: data.avatar_url || "",
          cover_photo_url: data.cover_photo_url || "",
          verified_badge_id: data.verified_badge_id,
          interests: data.interests || [],
        });
      }

      const { count } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id);

      setPostsCount(count || 0);
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateWalletAddress = async (address: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ wallet_address: address })
        .eq("user_id", user!.id);

      if (error) throw error;

      setProfile((prev) => ({ ...prev, wallet_address: address }));
      toast.success("Wallet connected to profile");
    } catch (error) {
      console.error("Error updating wallet:", error);
      toast.error("Failed to connect wallet to profile");
    }
  };

  const handleSave = async (data: { display_name: string; bio: string; interests: string[] }) => {
    setSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: data.display_name,
          bio: data.bio,
          interests: data.interests,
        })
        .eq("user_id", user!.id);

      if (error) throw error;

      setProfile((prev) => ({
        ...prev,
        display_name: data.display_name,
        bio: data.bio,
        interests: data.interests,
      }));

      // Check for new badges after profile update
      checkBadges(user!.id);

      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-6">
          <ProfileHeader
            userId={user!.id}
            displayName={profile.display_name}
            username={profile.username}
            avatarUrl={profile.avatar_url}
            coverPhotoUrl={profile.cover_photo_url}
            verifiedBadgeId={profile.verified_badge_id}
            isOwnProfile={true}
            onAvatarUpdate={(url) => setProfile((prev) => ({ ...prev, avatar_url: url }))}
            onCoverUpdate={(url) => setProfile((prev) => ({ ...prev, cover_photo_url: url }))}
          />

          <ProfileStats 
            userId={user!.id}
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

          <ProfileCompletion 
            profile={profile}
            onFieldClick={handleFieldClick}
          />

          <ProfileTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            postsContent={
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                  <ProfileIntro
                    bio={profile.bio}
                    email={user?.email}
                    walletAddress={profile.wallet_address}
                    interests={profile.interests}
                  />
                  <ProfileBadges badges={badges} />
                </div>
                <div className="lg:col-span-2 space-y-6">
                  <PostComposer
                    userId={user!.id}
                    avatarUrl={profile.avatar_url}
                    displayName={profile.display_name}
                    onPostCreated={() => {
                      loadProfile();
                      checkBadges(user!.id);
                    }}
                  />
                  <PostFeed userId={user!.id} currentUserId={user!.id} />
                </div>
              </div>
            }
            aboutContent={
              <ProfileAbout
                profile={profile}
                userEmail={user?.email}
                isOwnProfile={true}
                onSave={handleSave}
                saving={saving}
              />
            }
          />
        </div>
      </div>

      <FollowersModal
        open={followersModalOpen}
        onOpenChange={setFollowersModalOpen}
        userId={user!.id}
        defaultTab={followersModalTab}
      />
    </>
  );
};

export default Profile;
