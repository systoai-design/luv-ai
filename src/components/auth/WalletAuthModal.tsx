import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletName } from "@solana/wallet-adapter-base";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { clearWalletStorage } from "@/lib/walletReset";
import { Loader2, Wallet, AlertCircle, ExternalLink } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface WalletAuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type Step = "connect" | "checking" | "register";

const validateUsername = (username: string): string | null => {
  if (!username) return "Username is required";
  if (username.length < 3) return "Username must be at least 3 characters";
  if (username.length > 20) return "Username must be less than 20 characters";
  if (!/^[a-zA-Z0-9_]+$/.test(username)) return "Username can only contain letters, numbers, and underscores";
  return null;
};

const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms))
  ]);
};

export const WalletAuthModal = ({ open, onOpenChange, onSuccess }: WalletAuthModalProps) => {
  const { wallets, select, connected, publicKey, disconnect } = useWallet();
  const { authState, checkUsernameAvailable, registerWithWallet, signInWithWallet } = useWalletAuth();

  const [step, setStep] = useState<Step>("connect");
  const [connecting, setConnecting] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<WalletName | null>(null);
  
  // Registration state
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const isIframed = window.self !== window.top;
  const walletAddress = publicKey?.toBase58();

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setStep("connect");
      setConnecting(false);
      setSelectedWallet(null);
      setUsername("");
      setDisplayName("");
      setUsernameError(null);
    }
  }, [open]);

  // Safety guard: if "checking" takes too long, fall back to register
  useEffect(() => {
    if (step !== "checking") return;
    const t = setTimeout(() => {
      if (step === "checking") {
        console.warn('[wallet] Checking timed out, moving to register');
        toast.error("This is taking too long. Please complete quick registration.");
        setStep("register");
      }
    }, 9000);
    return () => clearTimeout(t);
  }, [step]);

  // Username validation with debounce
  useEffect(() => {
    if (!username || step !== "register") return;

    const validationError = validateUsername(username);
    if (validationError) {
      setUsernameError(validationError);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingUsername(true);
      const available = await checkUsernameAvailable(username);
      setUsernameError(available ? null : "Username already taken");
      setIsCheckingUsername(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [username, checkUsernameAvailable, step]);

  const waitForConnected = async (maxMs = 7000): Promise<boolean> => {
    const start = Date.now();
    while (Date.now() - start < maxMs) {
      if (connected && publicKey) {
        console.info('[wallet] Connection verified:', publicKey.toBase58());
        return true;
      }
      await new Promise(r => setTimeout(r, 100));
    }
    console.error('[wallet] Connection verification timeout');
    return false;
  };

  const showError = (error: any) => {
    const msg = String(error?.message || error);
    console.error('[wallet] Error:', error);

    if (/timeout/i.test(msg)) {
      toast.error("Connection timed out. Please unlock your wallet and try again.");
    } else if (/rejected|4001|user.*reject/i.test(msg)) {
      toast.error("Connection rejected. Please approve the request in your wallet.");
    } else if (/not.*found|install/i.test(msg)) {
      toast.error("Wallet not detected. Please install the extension and refresh.");
    } else if (/locked/i.test(msg)) {
      toast.error("Wallet is locked. Please unlock it and try again.");
    } else {
      toast.error("Failed to connect wallet. Try resetting cache below.");
    }
  };

  const handleConnect = async (walletName: WalletName) => {
    try {
      console.info('[wallet] Starting connection to:', walletName);
      setConnecting(true);
      setSelectedWallet(walletName);

      // Disconnect any existing connection first
      if (connected) {
        console.info('[wallet] Disconnecting existing wallet');
        await disconnect().catch(() => {});
        await new Promise(r => setTimeout(r, 200));
      }

      // Clear wallet cache
      await clearWalletStorage();

      // Select the wallet
      select(walletName);
      await new Promise(r => setTimeout(r, 100));

      // Get the adapter
      const wallet = wallets.find(w => w.adapter.name === walletName);
      if (!wallet) {
        throw new Error("Wallet adapter not found");
      }

      console.info('[wallet] Wallet adapter ready state:', wallet.adapter.readyState);

      // Immediately invoke connect() to trigger the extension popup
      console.info('[wallet] Calling adapter.connect()...');
      await withTimeout(wallet.adapter.connect(), 12000);
      console.info('[wallet] adapter.connect() resolved');

      // Wait for connection state to update
      const isConnected = await waitForConnected(7000);
      if (!isConnected) {
        throw new Error("Connection state did not update");
      }

      // Request a message signature to confirm ownership (if supported)
      try {
        const adapterAny = wallet.adapter as any;
        if (adapterAny && typeof adapterAny.signMessage === 'function') {
          console.info('[wallet] Requesting message signature...');
          const encoder = new TextEncoder();
          const nonce = Math.random().toString(36).slice(2);
          const msg = `LUVAI Sign-In\nAddress: ${publicKey!.toBase58()}\nNonce: ${nonce}\nDomain: ${window.location.host}\nTime: ${new Date().toISOString()}`;
          await withTimeout(adapterAny.signMessage(encoder.encode(msg)), 20000);
          console.info('[wallet] Message signed');
        } else {
          console.info('[wallet] Wallet does not support signMessage; skipping');
        }
      } catch (sigErr) {
        console.warn('[wallet] Message signing skipped/failed:', sigErr);
        // Do not block login flow on signature problems
      }

      // Proceed to account check
      console.info('[wallet] Connection successful, checking account...');
      setStep("checking");
      
      const address = publicKey!.toBase58();
      const result = await withTimeout(signInWithWallet(address), 8000);

      if (result.isNewUser) {
        console.info('[wallet] New user detected, showing registration');
        setStep("register");
      } else if (result.success) {
        console.info('[wallet] Existing user signed in successfully');
        toast.success("Welcome back! 💜");
        onOpenChange(false);
        onSuccess?.();
      } else {
        console.info('[wallet] Sign-in failed, falling back to registration', result?.error);
        toast.error(result?.error || "Sign-in failed. Please complete quick registration.");
        setStep("register");
      }
    } catch (error: any) {
      console.error('[wallet] Connection failed:', error);
      showError(error);
      setStep("connect");
    } finally {
      setConnecting(false);
      setSelectedWallet(null);
    }
  };

  const handleRegister = async () => {
    if (!walletAddress || !username || !displayName) return;

    const validationError = validateUsername(username);
    if (validationError || usernameError) {
      toast.error(validationError || usernameError || "Please fix errors before continuing");
      return;
    }

    try {
      setIsRegistering(true);
      console.info('[wallet] Registering new user:', { username, displayName });

      const result = await registerWithWallet(walletAddress, username, displayName);

      if (result.success) {
        console.info('[wallet] Registration successful');
        onOpenChange(false);
        onSuccess?.();
      }
    } catch (error: any) {
      console.error('[wallet] Registration error:', error);
      toast.error(error.message || "Registration failed");
    } finally {
      setIsRegistering(false);
    }
  };

  const handleResetCache = async () => {
    await clearWalletStorage();
    toast.success("Wallet cache cleared. Please try connecting again.");
  };

  const openInNewWindow = () => {
    window.open(window.location.href, "_blank");
    toast.info("Opening in new window...");
  };

  const availableWallets = wallets.filter(w => w.readyState === "Installed" || w.readyState === "Loadable");
  const phantomWallet = availableWallets.find(w => w.adapter.name === "Phantom");
  const solflareWallet = availableWallets.find(w => w.adapter.name === "Solflare");

  return (
    <Dialog open={open} onOpenChange={(open) => !connecting && !isRegistering && onOpenChange(open)}>
      <DialogContent className="sm:max-w-md">
        {step === "connect" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Connect Your Wallet
              </DialogTitle>
              <DialogDescription>
                Choose a wallet to connect. You'll see a popup to approve the connection.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-4">
              {phantomWallet && (
                <Button
                  onClick={() => handleConnect("Phantom" as WalletName)}
                  disabled={connecting}
                  className="w-full h-14 text-base"
                  variant="outline"
                >
                  {connecting && selectedWallet === "Phantom" ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <img src={phantomWallet.adapter.icon} alt="Phantom" className="mr-2 h-6 w-6" />
                      Connect Phantom
                    </>
                  )}
                </Button>
              )}

              {solflareWallet && (
                <Button
                  onClick={() => handleConnect("Solflare" as WalletName)}
                  disabled={connecting}
                  className="w-full h-14 text-base"
                  variant="outline"
                >
                  {connecting && selectedWallet === "Solflare" ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <img src={solflareWallet.adapter.icon} alt="Solflare" className="mr-2 h-6 w-6" />
                      Connect Solflare
                    </>
                  )}
                </Button>
              )}

              {availableWallets.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">No wallet detected.</p>
                  <p className="text-xs mt-1">Please install Phantom or Solflare extension.</p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetCache}
                className="w-full"
              >
                Reset Wallet Cache
              </Button>
              {isIframed && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={openInNewWindow}
                  className="w-full"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open in New Window
                </Button>
              )}
            </div>
          </>
        )}

        {step === "checking" && (
          <div className="py-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-lg font-medium">Checking your account...</p>
            <p className="text-sm text-muted-foreground mt-2">This will only take a moment</p>
          </div>
        )}

        {step === "register" && (
          <>
            <DialogHeader>
              <DialogTitle>Complete Your Profile</DialogTitle>
              <DialogDescription>
                Set up your username and display name to get started.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="username">
                  Username *
                  {isCheckingUsername && <span className="ml-2 text-xs text-muted-foreground">(checking...)</span>}
                </Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  placeholder="Enter your username"
                  disabled={isRegistering}
                />
                {usernameError && (
                  <p className="text-sm text-destructive">{usernameError}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name *</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your display name"
                  disabled={isRegistering}
                />
              </div>

              <Progress value={authState.isChecking ? 50 : 0} className="h-1" />

              <Button
                onClick={handleRegister}
                disabled={
                  isRegistering ||
                  !username ||
                  !displayName ||
                  !!usernameError ||
                  isCheckingUsername
                }
                className="w-full"
              >
                {isRegistering ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Complete Registration"
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
