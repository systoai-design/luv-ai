import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, Heart, Star, Check } from 'lucide-react';
import { useSwipe } from '@/hooks/useSwipe';
import { useCardSwipe } from '@/hooks/useCardSwipe';
import { triggerHaptic } from '@/lib/haptics';
import { toast } from 'sonner';

interface DiscoverCardProps {
  profile: {
    id: string;
    user_id: string;
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    interests: string[] | null;
    matchScore?: number;
    matchPercentage?: number;
    sharedInterests?: string[];
  };
  onSwipe: (matchData: any) => void;
}

const DiscoverCard = ({ profile, onSwipe }: DiscoverCardProps) => {
  const { swipe, isLoading } = useSwipe();

  const handleSwipeAction = async (action: 'like' | 'pass' | 'super_like') => {
    const matchData = await swipe(profile.user_id, action);
    
    if (matchData) {
      triggerHaptic('heavy'); // Celebration haptic on match
      toast.success("It's a match! 🎉");
    }
    
    onSwipe(matchData);
  };

  const {
    position,
    rotation,
    opacity: cardOpacity,
    isDragging,
    handleStart,
    animateSwipe,
    cardRef,
  } = useCardSwipe({
    onSwipe: (direction) => {
      const action = direction === 'right' ? 'like' : 'pass';
      handleSwipeAction(action);
    },
    threshold: 150,
  });

  const isSharedInterest = (interest: string) => 
    profile.sharedInterests?.includes(interest);

  // Calculate swipe indicators
  const swipeLeftOpacity = Math.min(Math.abs(Math.min(position.x, 0)) / 100, 1);
  const swipeRightOpacity = Math.min(Math.max(position.x, 0) / 100, 1);

  return (
    <Card 
      ref={cardRef}
      className="bg-card border-border overflow-hidden select-none cursor-grab active:cursor-grabbing transition-opacity"
      style={{
        transform: `translateX(${position.x}px) translateY(${position.y}px) rotate(${rotation}deg)`,
        opacity: cardOpacity,
        transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease-out',
      }}
      onMouseDown={handleStart}
      onTouchStart={handleStart}
    >
      {/* Swipe Left Indicator (X) */}
      {position.x < -50 && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center bg-destructive/20 pointer-events-none"
          style={{ opacity: swipeLeftOpacity }}
        >
          <div className="rounded-full bg-destructive p-8">
            <X className="h-20 w-20 text-destructive-foreground" strokeWidth={3} />
          </div>
        </div>
      )}

      {/* Swipe Right Indicator (Heart) */}
      {position.x > 50 && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center bg-primary/20 pointer-events-none"
          style={{ opacity: swipeRightOpacity }}
        >
          <div className="rounded-full bg-primary p-8">
            <Heart className="h-20 w-20 text-primary-foreground fill-current" strokeWidth={3} />
          </div>
        </div>
      )}

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
        
        {/* Match Score Badge */}
        {profile.matchPercentage && profile.matchPercentage > 0 && (
          <div className="absolute top-4 right-4">
            <Badge className="bg-primary text-primary-foreground text-lg font-bold px-4 py-2">
              {profile.matchPercentage}% Match
            </Badge>
          </div>
        )}
        
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background to-transparent p-6">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            {profile.display_name || 'Anonymous User'}
          </h2>
          {profile.matchScore && profile.matchScore > 0 && (
            <p className="text-sm text-primary font-semibold">
              {profile.matchScore} shared interest{profile.matchScore !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      <div className="p-6 space-y-4">
        {profile.bio && (
          <p className="text-muted-foreground">{profile.bio}</p>
        )}

        {profile.interests && profile.interests.length > 0 && (
          <div className="space-y-2">
            {profile.sharedInterests && profile.sharedInterests.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-xs font-semibold text-primary">Shared:</span>
                {profile.sharedInterests.map((interest, idx) => (
                  <Badge 
                    key={idx} 
                    className="bg-primary/20 text-primary border-primary"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    {interest}
                  </Badge>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {profile.interests
                .filter(interest => !isSharedInterest(interest))
                .map((interest, idx) => (
                  <Badge key={idx} variant="secondary">
                    {interest}
                  </Badge>
                ))}
            </div>
          </div>
        )}

        <div className="flex justify-center items-center gap-4 pt-4">
          <Button
            size="lg"
            variant="outline"
            className="rounded-full w-16 h-16 p-0 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => animateSwipe('left')}
            disabled={isLoading}
          >
            <X className="h-8 w-8" />
          </Button>

          <Button
            size="lg"
            className="rounded-full w-20 h-20 p-0 bg-primary hover:bg-primary/90"
            onClick={() => animateSwipe('right')}
            disabled={isLoading}
          >
            <Heart className="h-10 w-10 fill-current" />
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="rounded-full w-16 h-16 p-0 border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black"
            onClick={() => {
              triggerHaptic('success');
              handleSwipeAction('super_like');
            }}
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
