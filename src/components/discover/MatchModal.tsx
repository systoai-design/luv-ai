import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MatchModalProps {
  profile: {
    id: string;
    user_id: string;
    display_name: string | null;
    avatar_url: string | null;
    interests?: string[] | null;
    sharedInterests?: string[];
  };
  onClose: () => void;
}

const MatchModal = ({ profile, onClose }: MatchModalProps) => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('display_name, avatar_url, interests')
          .eq('user_id', user.id)
          .single();
        setCurrentUser(profileData);
      }
    };
    
    fetchCurrentUser();
    
    // Trigger animation
    setTimeout(() => setIsAnimating(true), 100);
  }, []);

  const sharedInterests = profile.sharedInterests || [];
  const hasSharedInterests = sharedInterests.length > 0;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl overflow-hidden p-0 bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <div className={`transition-all duration-700 ${isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          {/* Header with animated heart */}
          <div className="relative bg-primary/10 pt-8 pb-6 px-6">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-transparent" />
            <div className="relative flex justify-center items-center mb-4">
              <div className="relative">
                <Heart className="h-20 w-20 text-primary fill-primary animate-pulse" />
                <div className="absolute inset-0 animate-ping">
                  <Heart className="h-20 w-20 text-primary fill-primary opacity-40" />
                </div>
              </div>
            </div>
            <h2 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-primary via-pink-500 to-primary bg-clip-text text-transparent animate-fade-in">
              It's a Match!
            </h2>
            <p className="text-center text-muted-foreground animate-fade-in">
              You and {profile.display_name || 'this user'} liked each other
            </p>
          </div>

          {/* Profile Cards */}
          <div className="px-6 py-8">
            <div className="flex justify-center items-center gap-8 mb-8">
              {/* Current User */}
              <div className={`transition-all duration-700 delay-200 ${isAnimating ? 'translate-x-0 opacity-100' : '-translate-x-12 opacity-0'}`}>
                <div className="relative group">
                  <Avatar className="w-28 h-28 ring-4 ring-primary/20 group-hover:ring-primary/40 transition-all">
                    <AvatarImage
                      src={currentUser?.avatar_url || ''}
                      alt={currentUser?.display_name || 'You'}
                    />
                    <AvatarFallback className="text-3xl bg-primary/10">
                      {currentUser?.display_name?.[0]?.toUpperCase() || 'Y'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-background border border-border px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                    You
                  </div>
                </div>
              </div>

              {/* Heart Connector */}
              <div className={`transition-all duration-700 delay-300 ${isAnimating ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
                <div className="relative">
                  <Heart className="h-12 w-12 text-pink-500 fill-pink-500" />
                  <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-yellow-500 animate-pulse" />
                </div>
              </div>

              {/* Matched User */}
              <div className={`transition-all duration-700 delay-200 ${isAnimating ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0'}`}>
                <div className="relative group">
                  <Avatar className="w-28 h-28 ring-4 ring-primary/20 group-hover:ring-primary/40 transition-all">
                    <AvatarImage
                      src={profile.avatar_url || ''}
                      alt={profile.display_name || 'User'}
                    />
                    <AvatarFallback className="text-3xl bg-primary/10">
                      {profile.display_name?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-background border border-border px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                    {profile.display_name || 'User'}
                  </div>
                </div>
              </div>
            </div>

            {/* Shared Interests */}
            {hasSharedInterests && (
              <div className={`transition-all duration-700 delay-500 ${isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                <div className="bg-card border border-border rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-yellow-500" />
                    <h3 className="font-semibold text-sm">Shared Interests</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sharedInterests.map((interest, idx) => (
                      <Badge 
                        key={idx}
                        className="bg-primary/20 text-primary border-primary hover:bg-primary/30 transition-colors"
                      >
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className={`flex gap-3 transition-all duration-700 delay-600 ${isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
              <Button
                variant="outline"
                size="lg"
                className="flex-1 hover-scale"
                onClick={onClose}
              >
                Keep Swiping
              </Button>
              <Button
                size="lg"
                className="flex-1 gap-2 bg-gradient-to-r from-primary to-pink-500 hover:from-primary/90 hover:to-pink-500/90 hover-scale"
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MatchModal;
