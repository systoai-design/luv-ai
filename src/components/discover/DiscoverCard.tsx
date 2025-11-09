import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, Heart, Star, Check, Sparkles } from 'lucide-react';
import { useSwipe } from '@/hooks/useSwipe';
import { useCardSwipe } from '@/hooks/useCardSwipe';
import { triggerHaptic } from '@/lib/haptics';
import { playSound } from '@/lib/sounds';
import { toast } from 'sonner';
import { useSuperLikes } from '@/hooks/useSuperLikes';
import { useParticles } from '@/hooks/useParticles';
import { ParticleCanvas } from './ParticleCanvas';

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
  onSwipe: (swipeData: { match: any; swipeId: string }, action: 'like' | 'pass' | 'super_like') => void;
}

const DiscoverCard = ({ profile, onSwipe }: DiscoverCardProps) => {
  const { swipe, isLoading } = useSwipe();
  const { remaining: superLikesRemaining } = useSuperLikes();
  const { canvasRef, trigger: triggerParticles } = useParticles();
  const [isEntering, setIsEntering] = useState(true);

  const handleSwipeAction = async (action: 'like' | 'pass' | 'super_like') => {
    const result = await swipe(profile.user_id, action);
    
    if (result?.match) {
      triggerHaptic('heavy');
      playSound('match');
      triggerParticles('match');
      toast.success("It's a match! 🎉");
    }
    
    if (action === 'super_like') {
      triggerParticles('superlike');
    }
    
    onSwipe(result || { match: null, swipeId: '' }, action);
  };

  const {
    position,
    isDragging,
    isAnimating,
    handleStart,
    animateSwipe,
    cardRef,
  } = useCardSwipe({
    onSwipe: (direction) => {
      const action = direction === 'right' ? 'like' : 'pass';
      handleSwipeAction(action);
    },
    threshold: 120,
  });

  // Card entry animation
  useEffect(() => {
    setIsEntering(true);
    const timer = setTimeout(() => setIsEntering(false), 400);
    return () => clearTimeout(timer);
  }, [profile.id]);

  const isSharedInterest = (interest: string) => 
    profile.sharedInterests?.includes(interest);

  // Enhanced swipe indicators with exponential curve
  const indicatorLeftOpacity = position.x < 0 ? Math.pow(Math.abs(position.x) / 150, 1.5) : 0;
  const indicatorRightOpacity = position.x > 0 ? Math.pow(position.x / 150, 1.5) : 0;
  const iconScale = 1 + (Math.abs(position.x) / 250);
  const glowIntensity = Math.min(Math.abs(position.x) / 120, 1);

  return (
    <Card 
      ref={cardRef}
      className="bg-card border-border overflow-hidden select-none cursor-grab active:cursor-grabbing relative swipe-card"
      style={{
        transform: isEntering 
          ? 'translate3d(0, 20px, 0) scale(0.95)' 
          : 'translate3d(0, 0, 0)',
        opacity: isEntering ? 0 : 1,
        transition: isEntering 
          ? 'all 0.5s cubic-bezier(0.25, 1.2, 0.4, 1)' 
          : 'none',
        willChange: 'transform, opacity',
        contain: 'layout style paint',
      }}
      onMouseDown={handleStart}
      onTouchStart={handleStart}
    >
      <ParticleCanvas ref={canvasRef} />
      
      {/* Pass Indicator - Enhanced with glow */}
      <div
        className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none"
        style={{
          opacity: indicatorLeftOpacity,
          backdropFilter: position.x < 0 ? `blur(${indicatorLeftOpacity * 8}px)` : 'none',
        }}
      >
        <div 
          className="swipe-indicator-pass"
          style={{
            transform: `rotate(12deg) scale(${iconScale})`,
            boxShadow: position.x < -120 
              ? `0 0 ${30 * glowIntensity}px hsl(0 84.2% 60.2% / ${0.6 * glowIntensity})` 
              : 'none',
            transition: 'box-shadow 0.2s ease-out',
          }}
        >
          <X className="w-16 h-16" strokeWidth={3} />
        </div>
      </div>

      {/* Like Indicator - Enhanced with glow */}
      <div
        className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none"
        style={{
          opacity: indicatorRightOpacity,
          backdropFilter: position.x > 0 ? `blur(${indicatorRightOpacity * 8}px)` : 'none',
        }}
      >
        <div 
          className="swipe-indicator-like"
          style={{
            transform: `rotate(-12deg) scale(${iconScale})`,
            boxShadow: position.x > 120 
              ? `0 0 ${30 * glowIntensity}px hsl(280 70% 60% / ${0.6 * glowIntensity})` 
              : 'none',
            transition: 'box-shadow 0.2s ease-out',
          }}
        >
          <Heart className="w-16 h-16 fill-current" strokeWidth={3} />
        </div>
      </div>

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
            onClick={() => {
              triggerHaptic('medium');
              playSound('swipe');
              animateSwipe('left');
            }}
            disabled={isLoading}
          >
            <X className="h-8 w-8" />
          </Button>

          <Button
            size="lg"
            className="rounded-full w-20 h-20 p-0 bg-primary hover:bg-primary/90"
            onClick={() => {
              triggerHaptic('success');
              playSound('swipe');
              animateSwipe('right');
            }}
            disabled={isLoading}
          >
            <Heart className="h-10 w-10 fill-current" />
          </Button>

          <div className="relative">
            <Button
              size="lg"
              variant="outline"
              className="rounded-full w-16 h-16 p-0 border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black disabled:opacity-50 relative overflow-hidden group"
              onClick={() => {
                triggerHaptic('success');
                playSound('superlike');
                handleSwipeAction('super_like');
              }}
              disabled={isLoading || superLikesRemaining === 0}
            >
              <div className="absolute inset-0 bg-yellow-500/20 animate-pulse group-hover:bg-yellow-500/40" />
              <Sparkles className="h-8 w-8 relative z-10" />
            </Button>
            <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
              {superLikesRemaining}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default DiscoverCard;
