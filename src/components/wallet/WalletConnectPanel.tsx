import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletName } from "@solana/wallet-adapter-base";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, ExternalLink, RefreshCw } from "lucide-react";
import { clearWalletStorage } from "@/lib/walletReset";

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
  const { select, connect, disconnect, wallets, wallet, connected } = useWallet();
  const [connecting, setConnecting] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

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

      // Step 1: Disconnect any existing connection
      if (connected) {
        console.info('[wallet] Disconnecting existing wallet');
        await disconnect().catch(() => {});
      }

      // Step 2: Clear all cached wallet state
      console.info('[wallet] Clearing wallet cache');
      await clearWalletStorage();

      // Step 3: Select the target wallet
      console.info('[wallet] Selecting wallet:', walletName);
      select(walletName);

      // Step 4: Wait for selection to propagate
      console.info('[wallet] Waiting for wallet selection to apply');
      await waitUntil(() => wallet?.adapter?.name === walletName, 3000, 50);
      console.info('[wallet] Wallet selected:', wallet?.adapter?.name);

      // Step 5: Attempt connection with timeout
      console.info('[wallet] Attempting to connect');
      await withTimeout(connect(), 10000);

      console.info('[wallet] Connection successful!');
      toast.success("Wallet connected successfully! 🎉");
      onConnected();
      
    } catch (error: any) {
      console.error('[wallet] Connection failed:', error);

      // Fallback: Try connecting directly via adapter
      const targetWallet = wallets.find(w => w.adapter.name === walletName);
      if (targetWallet && !connected) {
        try {
          console.info('[wallet] Trying fallback: direct adapter connection');
          await withTimeout(targetWallet.adapter.connect(), 10000);
          
          console.info('[wallet] Fallback connection successful!');
          toast.success("Wallet connected successfully! 🎉");
          onConnected();
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

  if (connected) {
    return (
      <div className="text-center py-4">
        <p className="text-foreground">✅ Wallet connected successfully!</p>
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
              disabled={connecting || !isDetected}
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
