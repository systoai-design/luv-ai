import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, ShieldCheck, X, Sparkles } from "lucide-react";
import { useState } from "react";

const profiles = [
  {
    id: 1,
    name: "Sarah",
    age: 26,
    bio: "Art enthusiast | Coffee addict | World traveler ✈️",
    verified: true,
    distance: "2 miles away",
    interests: ["Art", "Travel", "Photography"],
  },
  {
    id: 2,
    name: "Alex",
    age: 28,
    bio: "Tech entrepreneur | Fitness junkie | Dog lover 🐕",
    verified: true,
    distance: "5 miles away",
    interests: ["Tech", "Fitness", "Startups"],
  },
  {
    id: 3,
    name: "Maya",
    age: 24,
    bio: "Musician | Foodie | Yoga instructor 🧘‍♀️",
    verified: false,
    distance: "3 miles away",
    interests: ["Music", "Yoga", "Cooking"],
  },
];

const DiscoverSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentProfile = profiles[currentIndex];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % profiles.length);
  };

  return (
    <section id="discover" className="py-24 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
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

        <div className="max-w-md mx-auto">
          <Card className="bg-card border-border shadow-card overflow-hidden card-gradient-hover">
            <div className="relative h-96 bg-gradient-to-br from-primary/20 to-secondary/20">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-9xl opacity-10">👤</div>
              </div>
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
                  onClick={handleNext}
                >
                  <X className="h-6 w-6 text-destructive" />
                </Button>
                
                <Button
                  size="lg"
                  className="rounded-full h-20 w-20 bg-gradient-primary shadow-glow"
                  onClick={handleNext}
                >
                  <Heart className="h-8 w-8" />
                </Button>
                
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full h-16 w-16 border-accent/50 hover:bg-accent/10"
                  onClick={handleNext}
                >
                  <MessageCircle className="h-6 w-6 text-accent" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default DiscoverSection;
