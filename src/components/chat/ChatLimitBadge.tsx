import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const ChatLimitBadge = () => {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [used, setUsed] = useState(0);
  const { toast } = useToast();
  const limit = 30;

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: usage } = await supabase
          .from('daily_chat_usage')
          .select('message_count')
          .eq('user_id', user.id)
          .eq('usage_date', new Date().toISOString().split('T')[0])
          .maybeSingle();

        const currentUsed = usage?.message_count || 0;
        setUsed(currentUsed);
        setRemaining(limit - currentUsed);

        // Show warning when approaching limit
        if (currentUsed >= limit - 5 && currentUsed < limit) {
          toast({
            title: "Approaching daily limit",
            description: `${limit - currentUsed} messages remaining today`,
            variant: "default",
          });
        }
      } catch (error) {
        console.error('Error fetching chat usage:', error);
      }
    };

    fetchUsage();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchUsage, 30000);
    return () => clearInterval(interval);
  }, [toast]);

  if (remaining === null) return null;

  const isLow = remaining <= 5;
  const isDepleted = remaining <= 0;

  return (
    <Badge 
      variant={isDepleted ? "destructive" : isLow ? "secondary" : "outline"}
      className="flex items-center gap-1 text-xs"
    >
      {isDepleted ? (
        <AlertCircle className="h-3 w-3" />
      ) : (
        <MessageSquare className="h-3 w-3" />
      )}
      <span>
        {used}/{limit} messages today
      </span>
    </Badge>
  );
};
