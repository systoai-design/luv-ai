import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, Heart, Star } from 'lucide-react';
import { useSwipe } from '@/hooks/useSwipe';
import { toast } from 'sonner';

interface DiscoverCardProps {
  profile: {
    id: string;
    user_id: string;
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    interests: string[] | null;
  };
  onSwipe: (matchData: any) => void;
}

const DiscoverCard = ({ profile, onSwipe }: DiscoverCardProps) => {
  const { swipe, isLoading } = useSwipe();

  const handleSwipe = async (action: 'like' | 'pass' | 'super_like') => {
    const matchData = await swipe(profile.user_id, action);
    
    if (matchData) {
      toast.success("It's a match! 🎉");
    }
    
    onSwipe(matchData);
  };

  return (
    <Card className="bg-card border-border overflow-hidden">
      <div className="relative h-96 bg-gradient-to-b from-background/50 to-background">
        <Avatar className="w-full h-full rounded-none">
          <AvatarImage
            src={profile.avatar_url || ''}
            alt={profile.display_name || 'User'}
            className="object-cover"
          />
          <AvatarFallback className="rounded-none text-6xl">
            {profile.display_name?.[0]?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background to-transparent p-6">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            {profile.display_name || 'Anonymous User'}
          </h2>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {profile.bio && (
          <p className="text-muted-foreground">{profile.bio}</p>
        )}

        {profile.interests && profile.interests.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {profile.interests.map((interest, idx) => (
              <Badge key={idx} variant="secondary">
                {interest}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex justify-center items-center gap-4 pt-4">
          <Button
            size="lg"
            variant="outline"
            className="rounded-full w-16 h-16 p-0 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => handleSwipe('pass')}
            disabled={isLoading}
          >
            <X className="h-8 w-8" />
          </Button>

          <Button
            size="lg"
            className="rounded-full w-20 h-20 p-0 bg-primary hover:bg-primary/90"
            onClick={() => handleSwipe('like')}
            disabled={isLoading}
          >
            <Heart className="h-10 w-10 fill-current" />
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="rounded-full w-16 h-16 p-0 border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black"
            onClick={() => handleSwipe('super_like')}
            disabled={isLoading}
          >
            <Star className="h-8 w-8" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default DiscoverCard;
