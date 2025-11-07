import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, MessageCircle } from 'lucide-react';
import AppHeader from '@/components/layout/AppHeader';

const Purchases = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadPurchases();
  }, [user, navigate]);

  const loadPurchases = async () => {
    try {
      const { data, error } = await supabase
        .from('companion_access')
        .select('*, ai_companions(*)')
        .eq('user_id', user!.id)
        .order('purchased_at', { ascending: false });

      if (error) throw error;
      setPurchases(data || []);
    } catch (error) {
      console.error('Error loading purchases:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your purchases',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <AppHeader />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <h1 className="text-4xl font-bold mb-8">My Purchases</h1>

        {purchases.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">You haven't purchased access to any companions yet</p>
              <Button onClick={() => navigate('/')}>Browse Companions</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {purchases.map((purchase) => (
              <Card key={purchase.id}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage
                        src={purchase.ai_companions?.avatar_url}
                        alt={purchase.ai_companions?.name}
                      />
                      <AvatarFallback>{purchase.ai_companions?.name?.[0]}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{purchase.ai_companions?.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {purchase.ai_companions?.tagline}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-sm text-muted-foreground">
                          Purchased {new Date(purchase.purchased_at).toLocaleDateString()}
                        </span>
                        <span className="text-sm font-medium">
                          {Number(purchase.access_price).toFixed(2)} SOL
                        </span>
                      </div>
                    </div>

                    <Button onClick={() => navigate(`/chat/${purchase.companion_id}`)}>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Chat
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Purchases;