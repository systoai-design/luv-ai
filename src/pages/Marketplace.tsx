import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateCompanionDialog } from "@/components/creator/CreateCompanionDialog";
import { useAuth } from "@/contexts/AuthContext";
import MarketplaceSection from "@/components/MarketplaceSection";

const Marketplace = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [canCreate, setCanCreate] = useState(false);

  useEffect(() => {
    checkCreatorStatus();
    setLoading(false);
  }, []);

  const checkCreatorStatus = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('can_create_companion')
      .eq('user_id', user.id)
      .single();
    setCanCreate(data?.can_create_companion || false);
  };

  const handleCompanionCreated = () => {
    // Trigger reload of MarketplaceSection via key change
    setLoading(true);
    setTimeout(() => setLoading(false), 100);
  };

  return (
    <div className="h-screen overflow-y-auto">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
              AI Companion Marketplace
            </h1>
            <p className="text-muted-foreground">
              Discover and connect with unique AI companions
            </p>
          </div>
          {canCreate && <CreateCompanionDialog onSuccess={handleCompanionCreated} />}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-96 w-full" />
            ))}
          </div>
        ) : (
          <MarketplaceSection key={loading ? 'loading' : 'loaded'} />
        )}
      </div>
    </div>
  );
};

export default Marketplace;
