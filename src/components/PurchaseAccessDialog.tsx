import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { sharedConnection } from '@/contexts/WalletContext';
import { executeWithRetry } from '@/lib/rpcManager';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Wifi, WifiOff, Wallet } from 'lucide-react';
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

const PLATFORM_WALLET = '5UD8QQ5WrJFXYcN7yy1iUkhvHoa6hyko4f9Wa3EDDeJ3';

export const PurchaseAccessDialog = ({
  open,
  onOpenChange,
  companion,
  onSuccess,
  onGrantAccess,
}: PurchaseAccessDialogProps) => {
  const { publicKey, sendTransaction, connected, connecting, select, wallets } = useWallet();
  const { setVisible } = useWalletModal();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [rpcStatus, setRpcStatus] = useState<'checking' | 'connected' | 'error'>('connected');
  const [currentStep, setCurrentStep] = useState<string>('');
  const [isWalletConnected, setIsWalletConnected] = useState(false);

  const handleConnectWallet = () => {
    setVisible(true);
  };

  // Track wallet connection state reactively
  useEffect(() => {
    console.log('[Purchase] Wallet state changed:', { connected, publicKey: publicKey?.toBase58() });
    setIsWalletConnected(connected && !!publicKey);
  }, [connected, publicKey]);

  // Check RPC connection when dialog opens
  useEffect(() => {
    if (open && isWalletConnected) {
      checkRpcConnection();
    }
  }, [open, isWalletConnected]);

  const checkRpcConnection = async () => {
    setRpcStatus('checking');
    setCurrentStep('Testing network connection...');
    
    try {
      await executeWithRetry(async (connection) => {
        await connection.getLatestBlockhash();
      }, 2);
      
      setRpcStatus('connected');
      setCurrentStep('');
      console.log('[Purchase] RPC connection verified');
    } catch (error) {
      console.error('[Purchase] RPC check failed:', error);
      setRpcStatus('error');
      setCurrentStep('Network connection unstable');
    }
  };

  const handlePurchase = async () => {
    console.log('[Purchase] Starting purchase:', { publicKey: publicKey?.toBase58(), connected, connecting, isWalletConnected });
    
    if (!isWalletConnected || !publicKey) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet first from the header menu',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    setCurrentStep('Preparing transaction...');
    let signature: string | undefined;

    try {
      const lamports = companion.access_price * 1000000000; // Convert SOL to lamports

      // Check balance with resilient connection
      setCurrentStep('Checking wallet balance...');
      const balance = await executeWithRetry(async (connection) => {
        return await connection.getBalance(publicKey);
      }, 5); // More aggressive retries
      
      const requiredLamports = lamports + 5000; // Add buffer for transaction fee
      
      if (balance < requiredLamports) {
        toast({
          title: 'Insufficient balance',
          description: 'You need more SOL to complete this purchase. Please add SOL to your wallet.',
          variant: 'destructive',
        });
        setIsProcessing(false);
        setCurrentStep('');
        return;
      }

      // Create transaction
      setCurrentStep('Creating transaction...');
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(PLATFORM_WALLET),
          lamports,
        })
      );

      // Send transaction
      setCurrentStep('Waiting for wallet approval...');
      toast({
        title: 'Sending transaction...',
        description: 'Please approve the transaction in your wallet',
      });

      // Use resilient connection for sending
      const connection = sharedConnection;
      signature = await sendTransaction(transaction, connection);
      console.log('[Purchase] Transaction sent:', signature);

      setCurrentStep('Confirming on blockchain...');
      toast({
        title: 'Confirming transaction...',
        description: 'This may take up to 90 seconds',
      });

      // Enhanced confirmation with more retries
      let confirmed = false;
      const maxRetries = 10; // Increased from 5
      let retryDelay = 2000;

      for (let i = 0; i < maxRetries && !confirmed; i++) {
        setCurrentStep(`Confirming transaction... (${i + 1}/${maxRetries})`);
        
        try {
          const confirmation = await executeWithRetry(async (conn) => {
            return await conn.confirmTransaction(signature!, 'confirmed');
          }, 2);
          
          if (confirmation.value.err) {
            throw new Error('Transaction failed on-chain');
          }

          confirmed = true;
          console.log(`[Purchase] Transaction confirmed after ${i + 1} attempts:`, signature);
        } catch (confirmError) {
          if (i === maxRetries - 1) {
            // Last retry - check transaction status manually
            console.log('[Purchase] Checking transaction status manually...');
            const status = await executeWithRetry(async (conn) => {
              return await conn.getSignatureStatus(signature!);
            }, 2);
            
            if (status.value?.confirmationStatus === 'confirmed' || 
                status.value?.confirmationStatus === 'finalized') {
              confirmed = true;
              console.log('[Purchase] Transaction confirmed via status check:', signature);
            } else {
              throw new Error(`Transaction confirmation timeout after ${maxRetries} attempts. Signature: ${signature}`);
            }
          } else {
            console.log(`[Purchase] Retry ${i + 1}/${maxRetries} waiting ${retryDelay}ms...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            retryDelay = Math.min(retryDelay * 1.3, 8000); // Cap at 8 seconds
          }
        }
      }

      if (!confirmed) {
        throw new Error(`Could not confirm transaction. Check status at: https://solscan.io/tx/${signature}`);
      }

      // Verify payment on backend
      setCurrentStep('Verifying payment...');
      const success = await onGrantAccess(signature, companion.access_price);

      if (success) {
        setCurrentStep('Success!');
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
      console.error('[Purchase] Error:', error);
      setCurrentStep('');
      let errorMessage = error instanceof Error ? error.message : 'Please try again';
      
      // Check for specific wallet errors
      if (errorMessage.includes('User rejected') || errorMessage.includes('rejected the request')) {
        errorMessage = 'Transaction was cancelled. Please try again and approve the transaction in your wallet.';
      } else if (errorMessage.includes('not been authorized') || errorMessage.includes('Wallet not connected')) {
        errorMessage = 'Please connect your wallet first using the wallet button in the header.';
      } else if (errorMessage.includes('RPC') || errorMessage.includes('403') || errorMessage.includes('Too Many Requests') || errorMessage.includes('rate limit')) {
        errorMessage = 'Network connection issues detected. Our system will automatically retry with backup connections. Please try again.';
      }
      
      toast({
        title: 'Purchase failed',
        description: signature 
          ? `${errorMessage}\n\nTransaction: ${signature}\nVerify at: https://solscan.io/tx/${signature}`
          : errorMessage,
        variant: 'destructive',
        duration: 8000,
      });
    } finally {
      setIsProcessing(false);
      setCurrentStep('');
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

          {/* RPC Status Indicator */}
          {isWalletConnected && (
            <div className="w-full flex items-center justify-center gap-2">
              {rpcStatus === 'checking' && (
                <Badge variant="outline" className="gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Checking network...
                </Badge>
              )}
              {rpcStatus === 'connected' && (
                <Badge variant="outline" className="gap-2 border-green-500 text-green-500">
                  <Wifi className="h-3 w-3" />
                  Network ready
                </Badge>
              )}
              {rpcStatus === 'error' && (
                <Badge variant="outline" className="gap-2 border-yellow-500 text-yellow-500">
                  <WifiOff className="h-3 w-3" />
                  Connection unstable (will auto-retry)
                </Badge>
              )}
            </div>
          )}

          {currentStep && (
            <p className="text-sm text-muted-foreground text-center animate-pulse">
              {currentStep}
            </p>
          )}

          <div className="w-full space-y-2 rounded-lg bg-muted p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Access type:</span>
              <span className="font-medium">Lifetime</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Messages:</span>
              <span className="font-medium">30/day</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Network:</span>
              <span className="font-medium">Solana Mainnet</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">RPC Provider:</span>
              <span className="font-medium text-xs">Helius (Premium)</span>
            </div>
          </div>

          {!isWalletConnected ? (
            <>
              <Button
                onClick={handleConnectWallet}
                className="w-full bg-gradient-primary hover:opacity-90"
                size="lg"
              >
                <Wallet className="mr-2 h-4 w-4" />
                Connect Wallet to Purchase
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                You need to connect your Solana wallet to complete the purchase
              </p>
            </>
          ) : (
            <>
              <Button
                onClick={handlePurchase}
                disabled={isProcessing || connecting || rpcStatus === 'error'}
                className="w-full bg-gradient-primary hover:opacity-90"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {currentStep || 'Processing...'}
                  </>
                ) : connecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : rpcStatus === 'error' ? (
                  'Network Error - Try Again'
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Purchase for {companion.access_price} SOL
                  </>
                )}
              </Button>
              
              {connecting && (
                <p className="text-sm text-muted-foreground text-center">
                  <Loader2 className="inline h-3 w-3 animate-spin mr-1" />
                  Connecting to your wallet...
                </p>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};