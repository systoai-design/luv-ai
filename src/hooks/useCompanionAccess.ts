import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useCompanionAccess = (companionId: string | undefined) => {
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [accessPrice, setAccessPrice] = useState<number>(0);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user || !companionId) {
        setIsLoading(false);
        return;
      }

      try {
        // Check if user has access
        const { data: access } = await supabase
          .from('companion_access')
          .select('id')
          .eq('user_id', user.id)
          .eq('companion_id', companionId)
          .maybeSingle();

        setHasAccess(!!access);

        // Get companion price
        if (!access) {
          const { data: companion } = await supabase
            .from('ai_companions')
            .select('access_price')
            .eq('id', companionId)
            .single();

          if (companion) {
            setAccessPrice(Number(companion.access_price));
          }
        }
      } catch (error) {
        console.error('Error checking access:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [user, companionId]);

  const grantAccess = async (transactionSignature: string, amount: number) => {
    if (!user || !companionId) return false;

    try {
      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: {
          companionId,
          transactionSignature,
          amount,
        },
      });

      if (error) throw error;

      if (data.success) {
        setHasAccess(true);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error granting access:', error);
      return false;
    }
  };

  return { hasAccess, isLoading, accessPrice, grantAccess };
};