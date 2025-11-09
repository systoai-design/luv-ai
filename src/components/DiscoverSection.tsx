import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, ShieldCheck, X, Sparkles } from "lucide-react";
import { useState } from "react";
import profilePlaceholder from "@/assets/profile-placeholder.jpg";
import alexAvatar from "@/assets/profiles/alex-avatar.jpg";
import mayaAvatar from "@/assets/profiles/maya-avatar.jpg";
import { useCardSwipe } from "@/hooks/useCardSwipe";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { cn } from "@/lib/utils";

const profiles = [
  {
    id: 1,
    name: "Sarah",
    age: 26,
    bio: "Art enthusiast | Coffee addict | World traveler ✈️",
    verified: true,
    distance: "2 miles away",
    interests: ["Art", "Travel", "Photography"],
    image: profilePlaceholder,
  },
  {
    id: 2,
    name: "Alex",
    age: 28,
    bio: "Tech entrepreneur | Fitness junkie | Dog lover 🐕",
    verified: true,
    distance: "5 miles away",
    interests: ["Tech", "Fitness", "Startups"],
    image: alexAvatar,
  },
  {
    id: 3,
    name: "Maya",
    age: 24,
    bio: "Musician | Foodie | Yoga instructor 🧘‍♀️",
    verified: false,
    distance: "3 miles away",
    interests: ["Music", "Yoga", "Cooking"],
    image: mayaAvatar,
  },
];

const DiscoverSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentProfile = profiles[currentIndex];
  const { elementRef, isVisible } = useScrollAnimation();

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % profiles.length);
  };

  const {
    position,
    isDragging,
    isAnimating,
    handleStart,
    animateSwipe,
    cardRef,
  } = useCardSwipe({
    onSwipe: handleNext,
    threshold: 150,
  });

  return (
    <section 
      id="discover" 
      ref={elementRef as React.RefObject<HTMLElement>}
      className={cn(
        "py-24 px-4 transition-all duration-1000",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      )}
    >
      <div className="container mx-auto max-w-6xl">
        <div 
          className={cn(
            "text-center mb-12 transition-all duration-700 delay-150",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-gradient-pulse">
              Discover
            </span>{" "}
            Real Connections
          </h2>
          <p className="text-xl text-muted-foreground">
            Swipe, match, and start meaningful conversations
          </p>
        </div>

        <div 
          className={cn(
            "max-w-md mx-auto transition-all duration-700 delay-300",
            isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
          )}
        >
          <div
            ref={cardRef}
            onMouseDown={handleStart}
            onTouchStart={handleStart}
            className="relative select-none"
            style={{
              cursor: isDragging ? 'grabbing' : 'grab',
              willChange: 'transform, opacity',
            }}
          >
            <Card className="bg-card border-border shadow-card overflow-hidden card-gradient-hover">
              <div className="relative h-96 overflow-hidden">
                <img 
                  src={currentProfile.image} 
                  alt={currentProfile.name}
                  className="w-full h-full object-cover pointer-events-none"
                  draggable="false"
                />
                
                {/* Left swipe indicator (Pass) */}
                {position.x < -50 && (
                  <div 
                    className="absolute inset-0 flex items-center justify-center bg-destructive/20 rounded-t-lg"
                    style={{ opacity: Math.min(Math.abs(position.x) / 150, 0.8) }}
                  >
                    <X className="h-32 w-32 text-destructive" strokeWidth={3} />
                  </div>
                )}

                {/* Right swipe indicator (Like) */}
                {position.x > 50 && (
                  <div 
                    className="absolute inset-0 flex items-center justify-center bg-green-500/20 rounded-t-lg"
                    style={{ opacity: Math.min(position.x / 150, 0.8) }}
                  >
                    <Heart className="h-32 w-32 text-green-500 fill-green-500" strokeWidth={3} />
                  </div>
                )}

                {currentProfile.verified && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-verified text-verified-foreground flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" />
                      Verified
                    </Badge>
                  </div>
                )}
              </div>
              
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold flex items-center gap-2">
                      {currentProfile.name}
                      {currentProfile.verified && (
                        <ShieldCheck className="h-5 w-5 text-verified" />
                      )}
                    </h3>
                    <p className="text-muted-foreground">{currentProfile.age} • {currentProfile.distance}</p>
                  </div>
                </div>

                <p className="text-foreground/90">{currentProfile.bio}</p>

                <div className="flex flex-wrap gap-2">
                  {currentProfile.interests.map((interest) => (
                    <Badge key={interest} variant="secondary" className="bg-muted">
                      {interest}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-4 pt-4">
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-full h-16 w-16 border-destructive/50 hover:bg-destructive/10"
                    onClick={() => animateSwipe('left')}
                    disabled={isAnimating}
                  >
                    <X className="h-6 w-6 text-destructive" />
                  </Button>
                  
                  <Button
                    size="lg"
                    className="rounded-full h-20 w-20 bg-gradient-primary shadow-glow"
                    onClick={() => animateSwipe('right')}
                    disabled={isAnimating}
                  >
                    <Heart className="h-8 w-8" />
                  </Button>
                  
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-full h-16 w-16 border-accent/50 hover:bg-accent/10"
                    onClick={handleNext}
                    disabled={isAnimating}
                  >
                    <MessageCircle className="h-6 w-6 text-accent" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DiscoverSection;
