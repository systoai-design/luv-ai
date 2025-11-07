import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Bot, MessageCircle, Sparkles, Heart, Zap, Brain, Smile, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Import companion avatars
import lunaAvatar from "@/assets/companions/luna-avatar.jpg";
import sophiaAvatar from "@/assets/companions/sophia-avatar.jpg";
import ariaAvatar from "@/assets/companions/aria-avatar.jpg";
import roseAvatar from "@/assets/companions/rose-avatar.jpg";
import scarlettAvatar from "@/assets/companions/scarlett-avatar.jpg";
import jennaAvatar from "@/assets/companions/jenna-avatar.jpg";

const avatarMap: Record<string, string> = {
  "Luna": lunaAvatar,
  "Sophia": sophiaAvatar,
  "Aria": ariaAvatar,
  "Rose": roseAvatar,
  "Scarlett": scarlettAvatar,
  "Jenna": jennaAvatar,
};

interface Companion {
  id: string;
  name: string;
  description: string;
  tagline: string;
  avatar_url: string;
  access_price: number;
  currency: string;
  average_rating: number;
  total_chats: number;
  romance: number;
  intelligence: number;
  playfulness: number;
  empathy: number;
  dominance: number;
  lust: number;
  loyalty: number;
  humor: number;
}

const MarketplaceSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const handleStartChat = (companionId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please connect your wallet to start chatting",
        variant: "destructive",
      });
      return;
    }
    navigate(`/chat/${companionId}`);
  };
  
  const { data: companions, isLoading } = useQuery({
    queryKey: ["companions"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("ai_companions")
        .select("id, name, description, tagline, avatar_url, access_price, currency, average_rating, total_chats, romance, intelligence, playfulness, empathy, dominance, lust, loyalty, humor")
        .eq("is_active", true)
        .order("average_rating", { ascending: false });
      
      if (error) throw error;
      return data as Companion[];
    },
  });

  const getPersonalityIcon = (trait: string) => {
    const icons: Record<string, any> = {
      romance: Heart,
      intelligence: Brain,
      playfulness: Smile,
      empathy: Sparkles,
      dominance: Zap,
    };
    return icons[trait] || Star;
  };

  return (
    <section id="marketplace" className="py-24 px-4 bg-gradient-to-b from-background to-background/50">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Discover Your{" "}
            <span className="text-gradient-animated">
              Perfect Companion
            </span>
          </h2>
          <p className="text-xl text-muted-foreground">
            AI companions with unique personalities, powered by advanced AI
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="bg-card border-border">
                <CardHeader>
                  <Skeleton className="h-32 w-32 rounded-full mx-auto mb-4" />
                  <Skeleton className="h-6 w-32 mx-auto mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companions?.map((companion) => {
              const topTraits = [
                { name: "romance", value: companion.romance },
                { name: "intelligence", value: companion.intelligence },
                { name: "playfulness", value: companion.playfulness },
                { name: "empathy", value: companion.empathy },
                { name: "dominance", value: companion.dominance },
              ]
                .sort((a, b) => (b.value || 0) - (a.value || 0))
                .slice(0, 3);

              return (
                <Card 
                  key={companion.id} 
                  className="bg-card border-border hover:border-primary/50 transition-all shadow-card hover:shadow-glow group cursor-pointer card-gradient-hover"
                >
                  <CardHeader className="text-center">
                    <div className="relative mx-auto mb-4">
                      <Avatar className="h-32 w-32 border-4 border-primary/20 group-hover:border-primary/50 transition-all">
                        <AvatarImage 
                          src={avatarMap[companion.name] || companion.avatar_url || ""} 
                          alt={companion.name}
                          className="object-cover"
                        />
                        <AvatarFallback>{companion.name[0]}</AvatarFallback>
                      </Avatar>
                      <Badge className="absolute -top-2 -right-2 bg-primary">
                        <Bot className="h-3 w-3 mr-1" />
                        AI
                      </Badge>
                    </div>

                    <div className="flex items-center justify-center gap-2 mb-2">
                      <CardTitle className="text-2xl">{companion.name}</CardTitle>
                      <div className="flex items-center text-sm text-yellow-500">
                        <Star className="h-4 w-4 fill-current mr-1" />
                        {companion.average_rating?.toFixed(1) || "5.0"}
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground italic mb-2">
                      "{companion.tagline}"
                    </p>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {companion.description}
                    </p>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Personality Traits */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Top Traits
                      </p>
                      <div className="flex gap-2">
                        {topTraits.map((trait) => {
                          const Icon = getPersonalityIcon(trait.name);
                          return (
                            <div 
                              key={trait.name}
                              className="flex-1 bg-muted/50 rounded-lg p-2 flex flex-col items-center gap-1"
                            >
                              <Icon className="h-4 w-4 text-primary" />
                              <span className="text-xs capitalize">{trait.name}</span>
                              <span className="text-xs font-bold">{trait.value}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />
                        <span>{companion.total_chats?.toLocaleString() || 0} chats</span>
                      </div>
                      <div className="font-semibold text-primary">
                        {companion.access_price} {companion.currency} one-time
                      </div>
                    </div>

                    <Button 
                      className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
                      onClick={() => handleStartChat(companion.id)}
                    >
                      Start Chat
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default MarketplaceSection;
