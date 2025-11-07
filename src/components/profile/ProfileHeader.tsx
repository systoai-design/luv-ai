import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Edit } from "lucide-react";
import { AvatarUpload } from "./AvatarUpload";
import { CoverPhotoUpload } from "./CoverPhotoUpload";

interface ProfileHeaderProps {
  userId: string;
  displayName?: string;
  username?: string;
  bio?: string;
  avatarUrl?: string;
  coverPhotoUrl?: string;
  verifiedBadgeId?: string | null;
  isOwnProfile: boolean;
  onEditClick?: () => void;
  onAvatarUpdate: (url: string) => void;
  onCoverUpdate: (url: string) => void;
}

export const ProfileHeader = ({
  userId,
  displayName,
  username,
  bio,
  avatarUrl,
  coverPhotoUrl,
  verifiedBadgeId,
  isOwnProfile,
  onEditClick,
  onAvatarUpdate,
  onCoverUpdate,
}: ProfileHeaderProps) => {
  return (
    <div className="bg-card rounded-lg overflow-hidden border border-border">
      <CoverPhotoUpload
        userId={userId}
        currentCoverUrl={coverPhotoUrl}
        isOwnProfile={isOwnProfile}
        onUploadComplete={onCoverUpdate}
      />
      
      <div className="px-6 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between -mt-16 sm:-mt-16">
          <AvatarUpload
            userId={userId}
            currentAvatarUrl={avatarUrl}
            displayName={displayName}
            isOwnProfile={isOwnProfile}
            onUploadComplete={onAvatarUpdate}
          />
          
          {isOwnProfile && onEditClick && (
            <Button
              variant="outline"
              onClick={onEditClick}
              className="mt-4 sm:mt-0"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
        
        <div className="mt-4">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">{displayName || "User"}</h1>
            {verifiedBadgeId && (
              <Badge className="bg-verified text-verified-foreground">
                <ShieldCheck className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>
          
          {username && (
            <p className="text-muted-foreground mt-1">@{username}</p>
          )}
          
          {bio && (
            <p className="mt-3 text-foreground">{bio}</p>
          )}
        </div>
      </div>
    </div>
  );
};
