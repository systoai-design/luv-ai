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

const PLATFORM_WALLET = 'DzrB51hp4RoR8ctsbKeuyJHe4KXr24cGewyTucBZezrF';

export const PurchaseAccessDialog = ({
  open,
  onOpenChange,
  companion,
  onSuccess,
  onGrantAccess,
}: PurchaseAccessDialogProps) => {
  const { publicKey, sendTransaction, connected, connecting } = useWallet();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePurchase = async () => {
    console.log('Purchase attempt:', { publicKey: publicKey?.toBase58(), connected, connecting });
    
    if (!connected || !publicKey) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet first from the header menu',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    let signature: string | undefined;

    try {
      // Use devnet for testing (matches WalletContext configuration)
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
      const lamports = companion.access_price * 1000000000; // Convert SOL to lamports

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(PLATFORM_WALLET),
          lamports,
        })
      );

      // Send transaction
      toast({
        title: 'Sending transaction...',
        description: 'Please approve the transaction in your wallet',
      });

      signature = await sendTransaction(transaction, connection);
      console.log('Transaction sent:', signature);

      toast({
        title: 'Confirming transaction...',
        description: 'This may take up to 60 seconds',
      });

      // Retry confirmation with exponential backoff
      let confirmed = false;
      const maxRetries = 5;
      let retryDelay = 2000; // Start with 2 seconds

      for (let i = 0; i < maxRetries && !confirmed; i++) {
        try {
          const confirmation = await connection.confirmTransaction(signature, 'confirmed');
          
          if (confirmation.value.err) {
            throw new Error('Transaction failed on-chain');
          }

          confirmed = true;
          console.log(`Transaction confirmed after ${i + 1} attempts:`, signature);
        } catch (confirmError) {
          if (i === maxRetries - 1) {
            // Last retry - check transaction status manually
            console.log('Checking transaction status manually...');
            const status = await connection.getSignatureStatus(signature);
            
            if (status.value?.confirmationStatus === 'confirmed' || 
                status.value?.confirmationStatus === 'finalized') {
              confirmed = true;
              console.log('Transaction confirmed via status check:', signature);
            } else {
              throw new Error(`Transaction confirmation timeout. Signature: ${signature}`);
            }
          } else {
            console.log(`Retry ${i + 1}/${maxRetries} failed, waiting ${retryDelay}ms...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            retryDelay *= 1.5; // Exponential backoff
          }
        }
      }

      if (!confirmed) {
        throw new Error(`Could not confirm transaction. Check status at: https://solscan.io/tx/${signature}?cluster=devnet`);
      }

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
        throw new Error('Payment verification failed on backend');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      let errorMessage = error instanceof Error ? error.message : 'Please try again';
      
      // Check for specific wallet errors
      if (errorMessage.includes('User rejected') || errorMessage.includes('rejected the request')) {
        errorMessage = 'Transaction was cancelled. Please try again and approve the transaction in your wallet.';
      } else if (errorMessage.includes('not been authorized') || errorMessage.includes('Wallet not connected')) {
        errorMessage = 'Please connect your wallet first using the wallet button in the header.';
      }
      
      toast({
        title: 'Purchase failed',
        description: signature 
          ? `${errorMessage}\n\nTransaction: ${signature}\nVerify at: https://solscan.io/tx/${signature}?cluster=devnet`
          : errorMessage,
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
            disabled={isProcessing || !connected || connecting}
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : connecting ? (
              'Connecting wallet...'
            ) : !connected ? (
              'Connect Wallet First'
            ) : (
              `Purchase for ${companion.access_price} SOL`
            )}
          </Button>

          {!connected && !connecting && (
            <p className="text-sm text-muted-foreground text-center">
              Please connect your wallet using the button in the header to continue
            </p>
          )}
          
          {connecting && (
            <p className="text-sm text-muted-foreground text-center">
              <Loader2 className="inline h-3 w-3 animate-spin mr-1" />
              Connecting to your wallet...
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};