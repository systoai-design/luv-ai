import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

const PLATFORM_WALLET = 'YourPlatformWalletAddressHere'; // Replace with actual platform wallet

export const PurchaseAccessDialog = ({
  open,
  onOpenChange,
  companion,
  onSuccess,
  onGrantAccess,
}: PurchaseAccessDialogProps) => {
  const { publicKey, sendTransaction } = useWallet();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePurchase = async () => {
    if (!publicKey) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet to continue',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      const connection = new Connection('https://api.mainnet-beta.solana.com');
      const lamports = companion.access_price * 1000000000; // Convert SOL to lamports

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(PLATFORM_WALLET),
          lamports,
        })
      );

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'confirmed');

      console.log('Transaction confirmed:', signature);

      // Verify payment on backend
      const success = await onGrantAccess(signature, companion.access_price);

      if (success) {
        toast({
          title: 'Access granted!',
          description: `You now have lifetime access to ${companion.name}`,
        });
        onSuccess();
        onOpenChange(false);
      } else {
        throw new Error('Payment verification failed');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast({
        title: 'Purchase failed',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Purchase Access</DialogTitle>
          <DialogDescription>
            Get lifetime access to chat with {companion.name}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-4">
          <Avatar className="h-24 w-24">
            <AvatarImage src={companion.avatar_url} alt={companion.name} />
            <AvatarFallback>{companion.name[0]}</AvatarFallback>
          </Avatar>

          <div className="text-center">
            <h3 className="text-2xl font-bold">{companion.name}</h3>
            <div className="mt-4 flex items-center justify-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-3xl font-bold">{companion.access_price} SOL</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">One-time payment</p>
          </div>

          <div className="w-full space-y-2 rounded-lg bg-muted p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Access type:</span>
              <span className="font-medium">Lifetime</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Messages:</span>
              <span className="font-medium">Unlimited</span>
            </div>
          </div>

          <Button
            onClick={handlePurchase}
            disabled={isProcessing || !publicKey}
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Purchase for ${companion.access_price} SOL`
            )}
          </Button>

          {!publicKey && (
            <p className="text-sm text-muted-foreground">
              Please connect your wallet to continue
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};