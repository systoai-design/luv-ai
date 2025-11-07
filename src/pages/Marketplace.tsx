import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Heart, MessageCircle, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const Marketplace = () => {
  const navigate = useNavigate();
  const [companions, setCompanions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompanions();
  }, []);

  const loadCompanions = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_companions')
        .select(`
          *,
          profiles:creator_id (
            display_name,
            username,
            avatar_url
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCompanions(data || []);
    } catch (error) {
      console.error('Error loading companions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-96 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
          AI Companion Marketplace
        </h1>
        <p className="text-muted-foreground">
          Discover and connect with unique AI companions
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companions.map((companion) => (
          <Card key={companion.id} className="overflow-hidden hover:shadow-glow transition-all duration-300 bg-card/50 border-border/50">
            <CardHeader className="p-0">
              <div className="relative h-48 bg-gradient-primary">
                <Avatar className="absolute bottom-4 left-4 h-24 w-24 border-4 border-card">
                  <AvatarImage src={companion.avatar_url} />
                  <AvatarFallback className="bg-primary/20 text-primary text-2xl">
                    {companion.name[0]}
                  </AvatarFallback>
                </Avatar>
                {companion.featured && (
                  <Badge className="absolute top-4 right-4 bg-verified">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Featured
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6 pb-4">
              <h3 className="text-xl font-bold mb-2">{companion.name}</h3>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {companion.tagline}
              </p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                <span className="flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  {companion.likes_count || 0}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  {companion.messages_count || 0}
                </span>
              </div>
              {companion.price_sol > 0 && (
                <Badge variant="outline" className="border-primary text-primary">
                  {companion.price_sol} SOL
                </Badge>
              )}
            </CardContent>
            <CardFooter className="pb-4">
              <Button
                className="w-full bg-gradient-primary hover:opacity-90"
                onClick={() => navigate(`/chat/${companion.id}`)}
              >
                Chat Now
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {companions.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No AI companions available yet.</p>
        </div>
      )}
    </div>
  );
};

export default Marketplace;
