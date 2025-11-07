import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WalletIcon } from "lucide-react";
import { InterestSelector } from "./InterestSelector";

interface ProfileAboutProps {
  profile: {
    username?: string;
    display_name?: string;
    bio?: string;
    wallet_address?: string;
    interests?: string[];
  };
  userEmail?: string;
  isOwnProfile: boolean;
  onSave?: (data: { display_name: string; bio: string; interests: string[] }) => void;
  saving?: boolean;
}

export const ProfileAbout = ({
  profile,
  userEmail,
  isOwnProfile,
  onSave,
  saving = false,
}: ProfileAboutProps) => {
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    profile.interests || []
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!onSave) return;

    const formData = new FormData(e.currentTarget);
    onSave({
      display_name: formData.get("display_name") as string,
      bio: formData.get("bio") as string,
      interests: selectedInterests,
    });
  };

  if (!isOwnProfile) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile.username && (
            <div>
              <Label className="text-muted-foreground">Username</Label>
              <p className="text-foreground">@{profile.username}</p>
            </div>
          )}
          {profile.bio && (
            <div>
              <Label className="text-muted-foreground">Bio</Label>
              <p className="text-foreground">{profile.bio}</p>
            </div>
          )}
          {profile.interests && profile.interests.length > 0 && (
            <div>
              <Label className="text-muted-foreground">Interests</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {profile.interests.map((interest, idx) => (
                  <Badge key={idx} variant="secondary">
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle>Edit Profile Information</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
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
              name="display_name"
              defaultValue={profile.display_name}
              placeholder="Your name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              name="bio"
              defaultValue={profile.bio}
              placeholder="Tell us about yourself..."
              rows={4}
            />
          </div>

          <InterestSelector
            selectedInterests={selectedInterests}
            onChange={setSelectedInterests}
          />

          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={userEmail || ""} disabled />
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

          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
