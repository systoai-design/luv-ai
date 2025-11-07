import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface CommentItemProps {
  comment: {
    id: string;
    user_id: string;
    content: string;
    created_at: string;
  };
  profile: {
    display_name?: string;
    avatar_url?: string;
    username?: string;
  };
  currentUserId: string;
  onDelete: () => void;
}

export const CommentItem = ({
  comment,
  profile,
  currentUserId,
  onDelete,
}: CommentItemProps) => {
  const isOwnComment = comment.user_id === currentUserId;

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", comment.id);

      if (error) throw error;

      toast.success("Comment deleted");
      onDelete();
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment");
    }
  };

  return (
    <div className="flex gap-2">
      <Avatar className="h-8 w-8">
        <AvatarImage src={profile.avatar_url} alt={profile.display_name || "User"} />
        <AvatarFallback className="text-xs">
          {profile.display_name?.charAt(0).toUpperCase() || "U"}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 bg-muted rounded-lg p-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold text-sm">{profile.display_name || "User"}</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </p>
          </div>

          {isOwnComment && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleDelete}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
        
        <p className="mt-1 text-sm">{comment.content}</p>
      </div>
    </div>
  );
};
