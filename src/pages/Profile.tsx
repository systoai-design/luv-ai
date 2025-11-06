import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@solana/wallet-adapter-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ShieldCheck, Wallet as WalletIcon } from "lucide-react";
import Header from "@/components/Header";

const Profile = () => {
  const { user } = useAuth();
  const { publicKey, connected } = useWallet();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    username: "",
    display_name: "",
    bio: "",
    wallet_address: "",
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
          verified_badge_id: data.verified_badge_id,
        });
      }
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: profile.display_name,
          bio: profile.bio,
        })
        .eq("user_id", user!.id);

      if (error) throw error;

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <Card className="max-w-2xl mx-auto bg-card/95 backdrop-blur-sm border-primary/30">
          <CardHeader>
              <CardTitle className="text-3xl font-bold flex items-center gap-2">
                Your Profile
                {profile.verified_badge_id && (
                  <Badge className="bg-verified text-verified-foreground">
                    <ShieldCheck className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-6">
                {profile.username && (
                  <div className="space-y-2">
                    <Label>Username</Label>
                    <div className="p-3 rounded-lg bg-muted font-medium text-sm">
                      @{profile.username}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Your username cannot be changed
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="display_name">Display Name</Label>
                  <Input
                    id="display_name"
                    value={profile.display_name}
                    onChange={(e) =>
                      setProfile({ ...profile, display_name: e.target.value })
                    }
                    placeholder="Your name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={profile.bio}
                    onChange={(e) =>
                      setProfile({ ...profile, bio: e.target.value })
                    }
                    placeholder="Tell us about yourself..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user?.email || ""} disabled />
                </div>

                {profile.wallet_address && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <WalletIcon className="h-4 w-4" />
                      Connected Wallet
                    </Label>
                    <div className="p-3 rounded-lg bg-muted font-mono text-sm break-all">
                      {profile.wallet_address}
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    className="bg-gradient-primary"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/")}
                  >
                    Cancel
                  </Button>
                </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
