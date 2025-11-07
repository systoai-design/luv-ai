import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletName } from "@solana/wallet-adapter-base";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, ExternalLink, RefreshCw } from "lucide-react";

interface WalletConnectPanelProps {
  onConnected: () => void;
}

export const WalletConnectPanel = ({ onConnected }: WalletConnectPanelProps) => {
  const { select, connect, wallets, connected } = useWallet();
  const [connecting, setConnecting] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  const clearWalletCache = () => {
    // Aggressively clear all wallet-related cache
    const keysToRemove = [
      'walletName',
      'walletAdapter',
      'walletAdapterNetwork',
      'wallet-adapter-connected-wallet',
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    
    toast.success("Wallet cache cleared. Please try connecting again.");
    setSelectedWallet(null);
    setConnecting(false);
  };

  const handleWalletConnect = async (walletName: WalletName) => {
    setSelectedWallet(walletName);
    setConnecting(true);

    try {
      console.log('Selecting wallet:', walletName);
      select(walletName);
      
      // Wait a bit for selection to register
      await new Promise(resolve => setTimeout(resolve, 300));
      
      console.log('Connecting to wallet...');
      
      // Set a timeout for connection
      const connectPromise = connect();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000)
      );
      
      await Promise.race([connectPromise, timeoutPromise]);
      
      console.log('Wallet connected successfully');
      toast.success("Wallet connected successfully! 🎉");
      onConnected();
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      
      let errorMessage = "Failed to connect wallet";
      
      if (error.message?.includes('timeout')) {
        errorMessage = "Connection timed out. Please check if your wallet extension is unlocked.";
      } else if (error.message?.includes('User rejected')) {
        errorMessage = "Connection rejected. Please approve the connection in your wallet.";
      } else if (error.message?.includes('not found')) {
        errorMessage = "Wallet not detected. Please install the wallet extension.";
      } else if (error.message?.includes('already connected')) {
        toast.success("Wallet already connected! 🎉");
        onConnected();
        return;
      }
      
      toast.error(errorMessage);
    } finally {
      setConnecting(false);
      setSelectedWallet(null);
    }
  };

  const openInNewWindow = () => {
    window.open(window.location.href, '_blank');
    toast.info("Opening app in new window for better wallet compatibility");
  };

  const availableWallets = wallets.filter(wallet => wallet.readyState === 'Installed' || wallet.readyState === 'Loadable');
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
        {availableWallets.map((wallet) => {
          const isDetected = wallet.readyState === 'Installed';
          const isConnecting = connecting && selectedWallet === wallet.adapter.name;
          
          return (
            <Button
              key={wallet.adapter.name}
              onClick={() => handleWalletConnect(wallet.adapter.name)}
              disabled={connecting || !isDetected}
              className="w-full justify-start gap-3 h-auto py-3"
              variant={isDetected ? "outline" : "ghost"}
            >
              {wallet.adapter.icon && (
                <img 
                  src={wallet.adapter.icon} 
                  alt={wallet.adapter.name}
                  className="w-6 h-6"
                />
              )}
              <span className="flex-1 text-left">
                {wallet.adapter.name}
                {isDetected && <span className="text-xs text-muted-foreground ml-2">(Detected)</span>}
              </span>
              {isConnecting && <Loader2 className="w-4 h-4 animate-spin" />}
            </Button>
          );
        })}
      </div>

      <div className="space-y-2 pt-4 border-t border-border">
        <Button
          onClick={clearWalletCache}
          variant="ghost"
          size="sm"
          className="w-full gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Reset Wallet Cache
        </Button>
        
        <Button
          onClick={openInNewWindow}
          variant="ghost"
          size="sm"
          className="w-full gap-2"
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
