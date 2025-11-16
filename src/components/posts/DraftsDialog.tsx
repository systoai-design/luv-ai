import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Clock, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Draft {
  id: string;
  content: string | null;
  image_url: string | null;
  visibility: string;
  updated_at: string;
}

interface DraftsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onLoadDraft: (draft: Draft) => void;
}

export const DraftsDialog = ({
  open,
  onOpenChange,
  userId,
  onLoadDraft,
}: DraftsDialogProps) => {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      loadDrafts();
    }
  }, [open, userId]);

  const loadDrafts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("post_drafts")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setDrafts(data || []);
    } catch (error) {
      console.error("Error loading drafts:", error);
      toast.error("Failed to load drafts");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadDraft = (draft: Draft) => {
    onLoadDraft(draft);
    onOpenChange(false);
    toast.success("Draft loaded");
  };

  const handleDeleteDraft = async (draftId: string) => {
    try {
      const { error } = await supabase
        .from("post_drafts")
        .delete()
        .eq("id", draftId);

      if (error) throw error;

      setDrafts((prev) => prev.filter((d) => d.id !== draftId));
      toast.success("Draft deleted");
    } catch (error) {
      console.error("Error deleting draft:", error);
      toast.error("Failed to delete draft");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Your Drafts</DialogTitle>
          <DialogDescription>
            Load a draft to continue editing or delete it.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Loading drafts...</div>
            </div>
          ) : drafts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No drafts saved yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your drafts will appear here automatically as you type
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {drafts.map((draft) => (
                <Card
                  key={draft.id}
                  className="p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-2 mb-2">
                        {draft.content || (
                          <span className="text-muted-foreground italic">
                            {draft.image_url ? "Draft with image" : "Empty draft"}
                          </span>
                        )}
                      </p>
                      {draft.image_url && (
                        <div className="mb-2">
                          <img
                            src={draft.image_url}
                            alt="Draft preview"
                            className="w-20 h-20 object-cover rounded border border-border"
                          />
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(draft.updated_at), {
                          addSuffix: true,
                        })}
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                          {draft.visibility}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleLoadDraft(draft)}
                      >
                        Load
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteDraft(draft.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
