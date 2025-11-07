import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, X } from "lucide-react";
import { useState } from "react";

interface ProfileCompletionProps {
  profile: {
    display_name?: string;
    bio?: string;
    avatar_url?: string;
    cover_photo_url?: string;
    interests?: string[];
    wallet_address?: string;
  };
  onFieldClick?: (field: string) => void;
}

interface CompletionField {
  key: string;
  label: string;
  completed: boolean;
  action: string;
}

export const ProfileCompletion = ({ profile, onFieldClick }: ProfileCompletionProps) => {
  const [dismissed, setDismissed] = useState(false);

  const fields: CompletionField[] = [
    {
      key: "display_name",
      label: "Display Name",
      completed: !!profile.display_name && profile.display_name.length > 0,
      action: "Add your display name",
    },
    {
      key: "bio",
      label: "Bio",
      completed: !!profile.bio && profile.bio.length > 0,
      action: "Write a bio",
    },
    {
      key: "avatar_url",
      label: "Profile Picture",
      completed: !!profile.avatar_url,
      action: "Upload a profile picture",
    },
    {
      key: "cover_photo_url",
      label: "Cover Photo",
      completed: !!profile.cover_photo_url,
      action: "Add a cover photo",
    },
    {
      key: "interests",
      label: "Interests",
      completed: !!profile.interests && profile.interests.length >= 3,
      action: "Select at least 3 interests",
    },
    {
      key: "wallet_address",
      label: "Wallet",
      completed: !!profile.wallet_address,
      action: "Connect your wallet",
    },
  ];

  const completedCount = fields.filter((f) => f.completed).length;
  const totalCount = fields.length;
  const completionPercentage = Math.round((completedCount / totalCount) * 100);
  const isComplete = completionPercentage === 100;

  if (isComplete || dismissed) return null;

  return (
    <Card className="p-6 bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20 relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6"
        onClick={() => setDismissed(true)}
      >
        <X className="h-4 w-4" />
      </Button>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-lg">Complete Your Profile</h3>
            <span className="text-sm font-medium text-primary">
              {completionPercentage}%
            </span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2">
            {completedCount} of {totalCount} completed
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {fields.map((field) => (
            <button
              key={field.key}
              onClick={() => onFieldClick?.(field.key)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-background/50 transition-colors text-left group"
            >
              {field.completed ? (
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0 group-hover:text-primary" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{field.label}</p>
                {!field.completed && (
                  <p className="text-xs text-muted-foreground truncate">
                    {field.action}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
};
