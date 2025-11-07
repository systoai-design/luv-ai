import { useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CoverPhotoUploadProps {
  userId: string;
  currentCoverUrl?: string;
  isOwnProfile: boolean;
  onUploadComplete: (url: string) => void;
}

export const CoverPhotoUpload = ({
  userId,
  currentCoverUrl,
  isOwnProfile,
  onUploadComplete,
}: CoverPhotoUploadProps) => {
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setUploading(true);

    try {
      if (currentCoverUrl) {
        const oldPath = currentCoverUrl.split("/").pop();
        if (oldPath) {
          await supabase.storage
            .from("cover-photos")
            .remove([`${userId}/${oldPath}`]);
        }
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("cover-photos")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("cover-photos")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ cover_photo_url: publicUrl })
        .eq("user_id", userId);

      if (updateError) throw updateError;

      onUploadComplete(publicUrl);
      toast.success("Cover photo updated");
    } catch (error) {
      console.error("Error uploading cover photo:", error);
      toast.error("Failed to upload cover photo");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative w-full h-64 bg-gradient-subtle overflow-hidden">
      {currentCoverUrl && (
        <img
          src={currentCoverUrl}
          alt="Cover"
          className="w-full h-full object-cover"
        />
      )}
      
      {isOwnProfile && (
        <label htmlFor="cover-upload">
          <Button
            variant="secondary"
            size="sm"
            className="absolute bottom-4 right-4"
            disabled={uploading}
            asChild
          >
            <div className="flex items-center gap-2">
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4" />
                  Edit Cover
                </>
              )}
            </div>
          </Button>
          <input
            id="cover-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
            disabled={uploading}
          />
        </label>
      )}
    </div>
  );
};
