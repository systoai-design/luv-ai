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
import { PostComposer } from "@/components/posts/PostComposer";
import { PostFeed } from "@/components/posts/PostFeed";
import { FollowersModal } from "@/components/profile/FollowersModal";

const Profile = () => {
  const { user } = useAuth();
  const { publicKey, connected } = useWallet();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [postsCount, setPostsCount] = useState(0);
  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [followersModalTab, setFollowersModalTab] = useState<"followers" | "following">("followers");
  const [profile, setProfile] = useState({
    username: "",
    display_name: "",
    bio: "",
    wallet_address: "",
    avatar_url: "",
    cover_photo_url: "",
    verified_badge_id: null,
  });

  useEffect(() => {
    if (user) {
      loadProfile();
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

  const handleSave = async (data: { display_name: string; bio: string }) => {
    setSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: data.display_name,
          bio: data.bio,
        })
        .eq("user_id", user!.id);

      if (error) throw error;

      setProfile((prev) => ({
        ...prev,
        display_name: data.display_name,
        bio: data.bio,
      }));

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
      <div className="container mx-auto px-4 py-8 max-w-6xl lg:pl-64 xl:pr-80">
        <div className="space-y-0">
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

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            {/* Left sidebar - Intro */}
            <div className="lg:col-span-1">
              <ProfileIntro
                bio={profile.bio}
                email={user?.email}
                walletAddress={profile.wallet_address}
              />
            </div>

            {/* Right column - Posts */}
            <div className="lg:col-span-2">
              <ProfileTabs
                postsContent={
                  <div className="space-y-6">
                    <PostComposer
                      userId={user!.id}
                      avatarUrl={profile.avatar_url}
                      displayName={profile.display_name}
                      onPostCreated={() => {
                        loadProfile();
                      }}
                    />
                    <PostFeed userId={user!.id} currentUserId={user!.id} />
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
