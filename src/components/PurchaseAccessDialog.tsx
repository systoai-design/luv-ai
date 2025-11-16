import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Mail } from 'lucide-react';

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

interface PurchaseAccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companion: {
    id: string;
    name: string;
    avatar_url?: string;
    access_price: number;
  };
  onSuccess: () => void;
  onGrantAccess: (signature: string, amount: number) => Promise<boolean>;
}

export const PurchaseAccessDialog = ({
  open,
  onOpenChange,
  companion,
}: PurchaseAccessDialogProps) => {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    // Simulate submission - this is just a placeholder UI
    await new Promise(resolve => setTimeout(resolve, 800));

    console.log('Early access signup:', { email, companion: companion.name });

    setSubmitted(true);
    toast({
      title: 'You\'re on the list!',
      description: 'We\'ll notify you when AI companion purchases are available.',
    });

    setTimeout(() => {
      onOpenChange(false);
      setSubmitted(false);
      setEmail('');
    }, 2000);

    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-2">
            <Badge className="bg-yellow-500 text-yellow-950 hover:bg-yellow-500">
              <Sparkles className="h-3 w-3 mr-1" />
              Coming Soon
            </Badge>
          </div>
          <DialogTitle className="text-2xl text-center">AI Companion Purchases</DialogTitle>
          <DialogDescription className="text-center">
            We're launching AI companion purchases soon! Get early access and be the first to know.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Companion Info */}
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <Avatar className="h-16 w-16">
              <AvatarImage 
                src={avatarMap[companion.name] || companion.avatar_url || ""} 
                alt={companion.name}
                className="object-cover"
              />
              <AvatarFallback>{companion.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{companion.name}</h3>
              <p className="text-sm text-muted-foreground opacity-50">
                {companion.access_price} SOL • Lifetime Access
              </p>
            </div>
          </div>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  We'll notify you when AI companion purchases go live
                </p>
              </div>

              <Button 
                type="submit"
                disabled={isSubmitting}
                className="w-full"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Get Early Access
                  </>
                )}
              </Button>
            </form>
          ) : (
            <div className="text-center py-8 space-y-3">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Mail className="h-8 w-8 text-green-500" />
                </div>
              </div>
              <h3 className="font-semibold text-lg">You're on the list!</h3>
              <p className="text-sm text-muted-foreground">
                We'll email you as soon as {companion.name} is available for purchase.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
