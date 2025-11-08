import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletName } from "@solana/wallet-adapter-base";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, ExternalLink, RefreshCw } from "lucide-react";
import { clearWalletStorage } from "@/lib/walletReset";
import { supabase } from "@/integrations/supabase/client";

interface WalletConnectPanelProps {
  onConnected: () => void;
}

// Helper to wait until a condition is true
const waitUntil = async (fn: () => boolean, maxMs = 3000, intervalMs = 50): Promise<void> => {
  const startTime = Date.now();
  while (Date.now() - startTime < maxMs) {
    if (fn()) return;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error('selection_timeout');
};

// Helper to add timeout to a promise
const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('connection_timeout')), ms)
    ),
  ]);
};

export const WalletConnectPanel = ({ onConnected }: WalletConnectPanelProps) => {
  const { select, connect, disconnect, wallets, wallet, connected, publicKey } = useWallet();
  const [connecting, setConnecting] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [connectionVerified, setConnectionVerified] = useState(false);
  const [isCheckingUser, setIsCheckingUser] = useState(false);
  const [isExistingUser, setIsExistingUser] = useState<boolean | null>(null);

// Helper to wait for connection state to update (increased timeout to 8s)
  const waitForConnection = async (maxMs = 8000): Promise<boolean> => {
    const startTime = Date.now();
    while (Date.now() - startTime < maxMs) {
      if (connected && publicKey) {
        console.info('[wallet] Connection verified! publicKey:', publicKey.toBase58());
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return false;
  };

  // Check if wallet exists in database
  const checkWalletExists = async (walletAddress: string): Promise<boolean> => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("wallet_address")
        .eq("wallet_address", walletAddress.toLowerCase())
        .maybeSingle();
      
      return !!data;
    } catch (error) {
      console.error('[wallet] Error checking wallet:', error);
      return false;
    }
  };

  const showError = (error: any) => {
    console.error('[wallet] Connection error:', error);
    
    const msg = String(error?.message || error);
    
    if (/timeout|timed out/i.test(msg)) {
      toast.error("Connection timed out. Make sure your wallet extension is unlocked and try again.");
    } else if (/user rejected|rejected|4001/i.test(msg)) {
      toast.error("Connection rejected. Please approve the connection in your wallet.");
    } else if (/not found|not detected|not installed/i.test(msg)) {
      toast.error("Wallet not detected. Please install the wallet extension first.");
    } else if (/selection_timeout/i.test(msg)) {
      toast.error("Could not select wallet. Try resetting the wallet cache.");
    } else {
      toast.error(`Failed to connect: ${error?.message || 'Unknown error'}`);
    }
  };

  const handleWalletConnect = async (walletName: WalletName) => {
    setSelectedWallet(walletName);
    setConnecting(true);

    try {
      console.info('[wallet] Starting connection flow for:', walletName);

      // Step 1: Only disconnect if connected to a DIFFERENT wallet
      if (connected && wallet?.adapter?.name !== walletName) {
        console.info('[wallet] Disconnecting existing wallet:', wallet?.adapter?.name);
        await disconnect().catch(() => {});
        
        // Step 2: Clear cached wallet state only when switching wallets
        console.info('[wallet] Clearing wallet cache due to wallet switch');
        await clearWalletStorage();
      }

      // Step 3: Select the target wallet
      console.info('[wallet] Selecting wallet:', walletName);
      select(walletName);

      // Step 4: Wait for selection to propagate
      console.info('[wallet] Waiting for wallet selection to apply');
      await waitUntil(() => wallet?.adapter?.name === walletName, 3000, 50);
      console.info('[wallet] Wallet selected:', wallet?.adapter?.name);

      // Step 5: Add small delay for state synchronization
      await new Promise(resolve => setTimeout(resolve, 150));

      // Step 6: Attempt connection with increased timeout (15s)
      console.info('[wallet] Opening wallet popup...');
      await withTimeout(connect(), 15000);

      // Step 7: Wait for connected state to actually update
      console.info('[wallet] Verifying connection...');
      const isConnected = await waitForConnection(8000);
      
      if (!isConnected) {
        throw new Error('Connection state did not update. Please check your wallet and try again.');
      }

      console.info('[wallet] Connection verified!');
      setConnectionVerified(true);
      
      // Check if user exists in database
      setIsCheckingUser(true);
      const walletAddress = publicKey.toBase58().toLowerCase();
      const exists = await checkWalletExists(walletAddress);
      setIsExistingUser(exists);
      setIsCheckingUser(false);

      if (exists) {
        // Existing user - automatically proceed
        console.info('[wallet] Existing user detected, auto-proceeding');
        toast.success("Welcome back! 💜");
        onConnected();
      } else {
        // New user - show registration prompt
        console.info('[wallet] New user detected, showing registration prompt');
        toast.success("Wallet connected successfully! 🎉");
      }
      
    } catch (error: any) {
      console.error('[wallet] Connection failed:', error);

      // Fallback: Try connecting directly via adapter
      const targetWallet = wallets.find(w => w.adapter.name === walletName);
      if (targetWallet && !connected) {
        try {
          console.info('[wallet] Trying fallback: direct adapter connection');
          await withTimeout(targetWallet.adapter.connect(), 15000);
          
          // Wait for connection state to update
          const isConnected = await waitForConnection(8000);
          if (!isConnected) {
            throw new Error('Fallback connection state did not update.');
          }
          
          console.info('[wallet] Fallback connection verified!');
          setConnectionVerified(true);
          
          // Check if user exists in database
          setIsCheckingUser(true);
          const walletAddress = publicKey.toBase58().toLowerCase();
          const exists = await checkWalletExists(walletAddress);
          setIsExistingUser(exists);
          setIsCheckingUser(false);

          if (exists) {
            // Existing user - automatically proceed
            console.info('[wallet] Existing user detected, auto-proceeding');
            toast.success("Welcome back! 💜");
            onConnected();
          } else {
            // New user - show registration prompt
            console.info('[wallet] New user detected, showing registration prompt');
            toast.success("Wallet connected successfully! 🎉");
          }
          return;
        } catch (fallbackError: any) {
          console.error('[wallet] Fallback also failed:', fallbackError);
          showError(fallbackError);
        }
      } else {
        showError(error);
      }
    } finally {
      setConnecting(false);
      setSelectedWallet(null);
    }
  };

  const handleManualContinue = () => {
    if (connected && publicKey) {
      console.info('[wallet] Manual continue clicked');
      toast.success("Proceeding to registration");
      onConnected();
    }
  };

  const handleResetCache = async () => {
    await clearWalletStorage();
    toast.success("Wallet cache cleared. Please try connecting again.");
    setSelectedWallet(null);
    setConnecting(false);
  };

  const openInNewWindow = () => {
    window.open(window.location.href, '_blank');
    toast.info("Opening app in new window for better wallet compatibility");
  };

  const availableWallets = wallets.filter(
    wallet => wallet.readyState === 'Installed' || wallet.readyState === 'Loadable'
  );
  const detectedWallets = wallets.filter(wallet => wallet.readyState === 'Installed');

  // Auto-proceed for existing users once check completes
  useEffect(() => {
    if (connected && publicKey && !isCheckingUser && isExistingUser === true && !connectionVerified) {
      console.info('[wallet] Auto-proceeding for existing user');
      setConnectionVerified(true);
      onConnected();
    }
  }, [connected, publicKey, isCheckingUser, isExistingUser, connectionVerified, onConnected]);

  if (connected && publicKey) {
    if (isCheckingUser) {
      return (
        <div className="text-center py-4 space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-foreground">Checking your account...</p>
          <p className="text-sm text-muted-foreground">{publicKey.toBase58().slice(0, 8)}...{publicKey.toBase58().slice(-8)}</p>
        </div>
      );
    }

    if (isExistingUser === false) {
      // New user - show registration button
      return (
        <div className="text-center py-4 space-y-3">
          <p className="text-foreground">✅ Wallet connected successfully!</p>
          <p className="text-sm text-muted-foreground">{publicKey.toBase58().slice(0, 8)}...{publicKey.toBase58().slice(-8)}</p>
          <Button 
            onClick={handleManualContinue}
            className="w-full"
          >
            Complete Registration
          </Button>
        </div>
      );
    }

    // Existing user or already verified - show loading/success
    return (
      <div className="text-center py-4 space-y-3">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-foreground">Signing you in...</p>
        <p className="text-sm text-muted-foreground">{publicKey.toBase58().slice(0, 8)}...{publicKey.toBase58().slice(-8)}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">Select Your Wallet</h3>
        <p className="text-sm text-muted-foreground">
          Choose a wallet to connect to LUVAI
        </p>
      </div>

      {detectedWallets.length === 0 && (
        <div className="bg-muted/50 p-3 rounded-lg text-sm text-muted-foreground text-center">
          No wallet detected. Please install Phantom or Solflare extension.
        </div>
      )}

      <div className="space-y-2">
        {availableWallets.map((walletOption) => {
          const isDetected = walletOption.readyState === 'Installed';
          const isConnecting = connecting && selectedWallet === walletOption.adapter.name;
          
          return (
            <Button
              key={walletOption.adapter.name}
              onClick={() => handleWalletConnect(walletOption.adapter.name)}
              disabled={connecting}
              className="w-full justify-start gap-3 h-auto py-3"
              variant={isDetected ? "outline" : "ghost"}
            >
              {walletOption.adapter.icon && (
                <img 
                  src={walletOption.adapter.icon} 
                  alt={walletOption.adapter.name}
                  className="w-6 h-6"
                />
              )}
              <span className="flex-1 text-left">
                {walletOption.adapter.name}
                {isDetected && <span className="text-xs text-muted-foreground ml-2">(Detected)</span>}
              </span>
              {isConnecting && <Loader2 className="w-4 h-4 animate-spin" />}
            </Button>
          );
        })}
      </div>

      <div className="space-y-2 pt-4 border-t border-border">
        <Button
          onClick={handleResetCache}
          variant="ghost"
          size="sm"
          className="w-full gap-2"
          disabled={connecting}
        >
          <RefreshCw className="w-4 h-4" />
          Reset Wallet Cache
        </Button>
        
        <Button
          onClick={openInNewWindow}
          variant="ghost"
          size="sm"
          className="w-full gap-2"
          disabled={connecting}
        >
          <ExternalLink className="w-4 h-4" />
          Open in New Window
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Having trouble? Try resetting the cache or opening in a new window.
      </p>
    </div>
  );
};
