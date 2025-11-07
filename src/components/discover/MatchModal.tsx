import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface MatchModalProps {
  profile: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  onClose: () => void;
}

const MatchModal = ({ profile, onClose }: MatchModalProps) => {
  const navigate = useNavigate();

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <div className="text-center space-y-6 py-6">
          <div className="flex justify-center items-center gap-4">
            <Heart className="h-16 w-16 text-primary fill-primary animate-pulse" />
          </div>

          <div>
            <h2 className="text-3xl font-bold mb-2">It's a Match!</h2>
            <p className="text-muted-foreground">
              You and {profile.display_name || 'this user'} liked each other
            </p>
          </div>

          <div className="flex justify-center">
            <Avatar className="w-32 h-32">
              <AvatarImage
                src={profile.avatar_url || ''}
                alt={profile.display_name || 'User'}
              />
              <AvatarFallback className="text-4xl">
                {profile.display_name?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Keep Swiping
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={() => {
                navigate('/messages');
                toast.success('You can now message each other!');
                onClose();
              }}
            >
              <MessageCircle className="h-4 w-4" />
              Send Message
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MatchModal;
