import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, Check, Clock, Send } from "lucide-react";
import { ChatRequestDialog } from "./ChatRequestDialog";
import { useNavigate } from "react-router-dom";

interface ChatRequestButtonProps {
  status: 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'rejected' | 'cancelled';
  matchId?: string | null;
  loading?: boolean;
  recipientName: string;
  recipientAvatar?: string;
  onSendRequest: (message?: string) => Promise<void>;
  onAcceptRequest: () => Promise<string | undefined>;
}

export const ChatRequestButton = ({
  status,
  matchId,
  loading,
  recipientName,
  recipientAvatar,
  onSendRequest,
  onAcceptRequest,
}: ChatRequestButtonProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const navigate = useNavigate();

  const handleAccept = async () => {
    const newMatchId = await onAcceptRequest();
    if (newMatchId) {
      navigate('/messages');
    }
  };

  const handleMessage = () => {
    navigate('/messages');
  };

  if (status === 'accepted' || matchId) {
    return (
      <Button onClick={handleMessage}>
        <MessageCircle className="h-4 w-4 mr-2" />
        Message
      </Button>
    );
  }

  if (status === 'pending_received') {
    return (
      <Button onClick={handleAccept} disabled={loading} variant="default" className="notification-glow">
        <Check className="h-4 w-4 mr-2" />
        Accept Request
      </Button>
    );
  }

  if (status === 'pending_sent') {
    return (
      <Button disabled variant="secondary">
        <Clock className="h-4 w-4 mr-2" />
        Request Sent
      </Button>
    );
  }

  // If rejected or cancelled, allow sending new request
  if (status === 'rejected' || status === 'cancelled') {
    return (
      <>
        <Button onClick={() => setDialogOpen(true)} disabled={loading}>
          <Send className="h-4 w-4 mr-2" />
          Request Chat
        </Button>
        <ChatRequestDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          recipientName={recipientName}
          recipientAvatar={recipientAvatar}
          onSend={onSendRequest}
        />
      </>
    );
  }

  return (
    <>
      <Button onClick={() => setDialogOpen(true)} disabled={loading}>
        <Send className="h-4 w-4 mr-2" />
        Request Chat
      </Button>
      <ChatRequestDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        recipientName={recipientName}
        recipientAvatar={recipientAvatar}
        onSend={onSendRequest}
      />
    </>
  );
};
