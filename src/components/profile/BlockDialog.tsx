import { useState } from 'react';
import { Ban } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface BlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  username: string;
}

export const BlockDialog = ({
  open,
  onOpenChange,
  userId,
  username,
}: BlockDialogProps) => {
  const { user } = useAuth();
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBlock = async () => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('user_blocks').insert({
        blocker_id: user.id,
        blocked_id: userId,
        reason: reason || null,
      });

      if (error) throw error;

      toast.success('User blocked', {
        description: `You won't see content from ${username} anymore`,
      });
      onOpenChange(false);
      setReason('');
    } catch (error: any) {
      console.error('Error blocking user:', error);
      toast.error('Failed to block user', {
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5 text-destructive" />
            Block {username}?
          </DialogTitle>
          <DialogDescription>
            This user will no longer be able to see your profile, send you
            messages, or interact with your content.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Textarea
              id="reason"
              placeholder="Why are you blocking this user?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleBlock}
            disabled={isSubmitting}
          >
            Block User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
