import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, X, ChevronDown } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import profilePlaceholder from "@/assets/profile-placeholder.jpg";
import alexAvatar from "@/assets/profiles/alex-avatar.jpg";
import mayaAvatar from "@/assets/profiles/maya-avatar.jpg";
import { useCardSwipe } from "@/hooks/useCardSwipe";

const demoProfiles = [
  {
    id: 1,
    name: "Sarah",
    age: 26,
    interests: ["Art", "Travel", "Photography"],
    image: profilePlaceholder,
  },
  {
    id: 2,
    name: "Alex",
    age: 28,
    interests: ["Tech", "Fitness", "Startups"],
    image: alexAvatar,
  },
  {
    id: 3,
    name: "Maya",
    age: 24,
    interests: ["Music", "Yoga", "Cooking"],
    image: mayaAvatar,
  },
];

const SwipeDemo = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [lastInteraction, setLastInteraction] = useState(Date.now());
  const [showPrompt, setShowPrompt] = useState(true);

  const handleNext = useCallback(() => {
    setIsTransitioning(true);
    setLastInteraction(Date.now());
    setShowPrompt(false);
    
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % demoProfiles.length);
      setIsTransitioning(false);
    }, 100);
  }, []);

  // Auto-cycle if no interaction for 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const timeSinceInteraction = Date.now() - lastInteraction;
      if (timeSinceInteraction > 5000 && !isTransitioning) {
        handleNext();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastInteraction, isTransitioning, handleNext]);

  const {
    position,
    isDragging,
    isAnimating,
    handleStart,
    animateSwipe,
    cardRef,
  } = useCardSwipe({
    onSwipe: handleNext,
    threshold: 120,
  });

  const currentProfile = demoProfiles[currentIndex];
  const nextProfile = demoProfiles[(currentIndex + 1) % demoProfiles.length];
  const thirdProfile = demoProfiles[(currentIndex + 2) % demoProfiles.length];

  const indicatorLeftOpacity = position.x < 0 ? Math.min(Math.abs(position.x) / 120, 0.8) : 0;
  const indicatorRightOpacity = position.x > 0 ? Math.min(position.x / 120, 0.8) : 0;

  return (
    <div className="relative max-w-sm mx-auto">
      {/* Try Swiping Prompt */}
      {showPrompt && (
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-20 animate-fade-in">
          <div className="bg-primary/90 text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 shadow-lg">
            Try swiping!
            <ChevronDown className="h-4 w-4 animate-bounce" />
          </div>
        </div>
      )}

      <div className="relative" style={{ minHeight: '480px' }}>
        {/* Third card - furthest back */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            transform: isTransitioning
              ? 'translate3d(0, 8px, 0) scale(0.92)'
              : 'translate3d(0, 16px, 0) scale(0.88)',
            opacity: isTransitioning ? 0.5 : 0.3,
            zIndex: 1,
            transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
            transitionDelay: '100ms',
            willChange: 'transform, opacity',
          }}
        >
          <MiniCard profile={thirdProfile} />
        </div>

        {/* Second card - middle */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            transform: isTransitioning
              ? 'translate3d(0, 0, 0) scale(1)'
              : 'translate3d(0, 8px, 0) scale(0.92)',
            opacity: isTransitioning ? 0.9 : 0.6,
            zIndex: 5,
            transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
            transitionDelay: '50ms',
            willChange: 'transform, opacity',
          }}
        >
          <MiniCard profile={nextProfile} />
        </div>

        {/* Current card - front */}
        <div
          ref={cardRef}
          onMouseDown={handleStart}
          onTouchStart={handleStart}
          className="relative select-none"
          style={{
            cursor: isDragging ? 'grabbing' : 'grab',
            zIndex: 10,
            willChange: 'transform, opacity',
            isolation: 'isolate', // Create stacking context for trails
          }}
        >
          <Card className="bg-card border-border shadow-xl overflow-hidden">
            <div className="relative h-80 overflow-hidden">
              <img
                src={currentProfile.image}
                alt={currentProfile.name}
                className="w-full h-full object-cover pointer-events-none"
                draggable="false"
              />

              {/* Left swipe indicator (Pass) */}
              {indicatorLeftOpacity > 0 && (
                <div
                  className="absolute inset-0 flex items-center justify-center bg-destructive/20"
                  style={{ opacity: indicatorLeftOpacity }}
                >
                  <div className="swipe-indicator-pass" style={{ transform: 'rotate(12deg)' }}>
                    <X className="w-20 h-20" strokeWidth={3} />
                  </div>
                </div>
              )}

              {/* Right swipe indicator (Like) */}
              {indicatorRightOpacity > 0 && (
                <div
                  className="absolute inset-0 flex items-center justify-center bg-primary/20"
                  style={{ opacity: indicatorRightOpacity }}
                >
                  <div className="swipe-indicator-like" style={{ transform: 'rotate(-12deg)' }}>
                    <Heart className="w-20 h-20 fill-current" strokeWidth={3} />
                  </div>
                </div>
              )}
            </div>

            <CardContent className="p-5 space-y-3">
              <div>
                <h3 className="text-2xl font-bold">
                  {currentProfile.name}, {currentProfile.age}
                </h3>
              </div>

              <div className="flex flex-wrap gap-2">
                {currentProfile.interests.map((interest) => (
                  <Badge key={interest} variant="secondary">
                    {interest}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center justify-center gap-4 pt-2">
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full h-14 w-14 border-destructive/50 hover:bg-destructive/10"
                  onClick={() => {
                    setLastInteraction(Date.now());
                    setShowPrompt(false);
                    animateSwipe('left');
                  }}
                  disabled={isAnimating}
                >
                  <X className="h-6 w-6 text-destructive" />
                </Button>

                <Button
                  size="lg"
                  className="rounded-full h-16 w-16 bg-primary hover:bg-primary/90 shadow-lg"
                  onClick={() => {
                    setLastInteraction(Date.now());
                    setShowPrompt(false);
                    animateSwipe('right');
                  }}
                  disabled={isAnimating}
                >
                  <Heart className="h-7 w-7" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Simplified mini card for background
const MiniCard = ({ profile }: { profile: typeof demoProfiles[0] }) => (
  <Card className="bg-card/80 backdrop-blur-sm border-border/50 overflow-hidden">
    <div className="h-80 bg-muted" />
    <CardContent className="p-5">
      <div className="space-y-3">
        <div className="h-7 bg-muted rounded animate-pulse" />
        <div className="flex gap-2">
          <div className="h-6 w-16 bg-muted rounded animate-pulse" />
          <div className="h-6 w-16 bg-muted rounded animate-pulse" />
          <div className="h-6 w-20 bg-muted rounded animate-pulse" />
        </div>
        <div className="flex justify-center gap-4 pt-2">
          <div className="h-14 w-14 bg-muted rounded-full animate-pulse" />
          <div className="h-16 w-16 bg-muted rounded-full animate-pulse" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export default SwipeDemo;
