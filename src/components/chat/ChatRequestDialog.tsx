import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send } from "lucide-react";

interface ChatRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientName: string;
  recipientAvatar?: string;
  onSend: (message?: string) => Promise<void>;
}

export const ChatRequestDialog = ({
  open,
  onOpenChange,
  recipientName,
  recipientAvatar,
  onSend,
}: ChatRequestDialogProps) => {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    setSending(true);
    try {
      await onSend(message.trim() || undefined);
      setMessage("");
      onOpenChange(false);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Chat Request</DialogTitle>
          <DialogDescription>
            Send a chat request to connect with {recipientName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center gap-3 py-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={recipientAvatar} />
            <AvatarFallback>{recipientName[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{recipientName}</p>
          </div>
        </div>

        <div className="space-y-4">
          <Textarea
            placeholder="Say something nice... (optional)"
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 200))}
            maxLength={200}
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground text-right">
            {message.length}/200
          </p>
        </div>

        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={sending}
          >
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={sending}>
            <Send className="h-4 w-4 mr-2" />
            Send Request
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
