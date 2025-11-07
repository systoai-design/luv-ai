import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Edit } from "lucide-react";
import { AvatarUpload } from "./AvatarUpload";
import { CoverPhotoUpload } from "./CoverPhotoUpload";
import { FollowButton } from "./FollowButton";

interface ProfileHeaderProps {
  userId: string;
  displayName?: string;
  username?: string;
  avatarUrl?: string;
  coverPhotoUrl?: string;
  verifiedBadgeId?: string | null;
  isOwnProfile: boolean;
  currentUserId?: string;
  onEditClick?: () => void;
  onAvatarUpdate: (url: string) => void;
  onCoverUpdate: (url: string) => void;
  chatRequestButton?: React.ReactNode;
}

export const ProfileHeader = ({
  userId,
  displayName,
  username,
  avatarUrl,
  coverPhotoUrl,
  verifiedBadgeId,
  isOwnProfile,
  currentUserId,
  onEditClick,
  onAvatarUpdate,
  onCoverUpdate,
  chatRequestButton,
}: ProfileHeaderProps) => {
  return (
    <div className="bg-card rounded-lg overflow-hidden border border-border shadow-sm">
      {/* Cover Photo */}
      <CoverPhotoUpload
        userId={userId}
        currentCoverUrl={coverPhotoUrl}
        isOwnProfile={isOwnProfile}
        onUploadComplete={onCoverUpdate}
      />
      
      {/* Profile Info Section */}
      <div className="px-6 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between -mt-20">
          {/* Profile Picture - Overlays cover photo */}
          <div className="relative">
            <AvatarUpload
              userId={userId}
              currentAvatarUrl={avatarUrl}
              displayName={displayName}
              isOwnProfile={isOwnProfile}
              onUploadComplete={onAvatarUpdate}
            />
          </div>
          
          {/* Action Buttons */}
          <div className="mt-4 sm:mt-0 flex gap-2">
            {isOwnProfile && onEditClick && (
              <Button
                variant="outline"
                onClick={onEditClick}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
            {!isOwnProfile && currentUserId && (
              <div className="flex gap-2">
                <FollowButton currentUserId={currentUserId} targetUserId={userId} />
                {chatRequestButton}
              </div>
            )}
          </div>
        </div>
        
        {/* Name and Username */}
        <div className="mt-4">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-3xl font-bold text-foreground">{displayName || "User"}</h1>
            {verifiedBadgeId && (
              <Badge className="bg-verified text-verified-foreground">
                <ShieldCheck className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>
          
          {username && (
            <p className="text-muted-foreground text-base mt-1">@{username}</p>
          )}
        </div>
      </div>
    </div>
  );
};
