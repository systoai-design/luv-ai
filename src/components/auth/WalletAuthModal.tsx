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
import { supabase } from "@/integrations/supabase/client";
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

// Event-driven helper: waits for adapter to emit 'connect' event
const waitForAdapterConnected = (adapter: any, timeoutMs: number): Promise<boolean> => {
  return new Promise((resolve) => {
    // If already connected, resolve immediately
    if (adapter.connected && adapter.publicKey) {
      console.info('[wallet] Adapter already connected');
      resolve(true);
      return;
    }

    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.warn('[wallet] Adapter connection event timeout');
        resolve(false);
      }
    }, timeoutMs);

    // Listen for the connect event
    const onConnect = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        console.info('[wallet] Adapter connect event received');
        resolve(true);
      }
    };

    adapter.once('connect', onConnect);
  });
};

export const WalletAuthModal = ({ open, onOpenChange, onSuccess }: WalletAuthModalProps) => {
  const { wallets, select, connected, publicKey, disconnect, connect } = useWallet();
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

  // Auto-detect already connected wallet and proceed to authentication
  useEffect(() => {
    if (!open || !connected || !publicKey) return;
    
    const autoAuthenticate = async () => {
      console.log('[wallet] Auto-detecting connected wallet:', publicKey.toBase58());
      setConnecting(true);
      setStep("checking");
      
      try {
        const walletAddress = publicKey.toBase58();
        const result = await signInWithWallet(walletAddress);
        
        if (result.isNewUser) {
          console.log('[wallet] New user detected, showing registration');
          setStep("register");
          setConnecting(false);
        } else if (result.success) {
          console.log('[wallet] Existing user signed in successfully');
          toast.success("Welcome back!");
          onOpenChange(false);
          onSuccess?.();
        } else if (result.error) {
          console.error('[wallet] Authentication error:', result.error);
          showError(result.error);
          setStep("connect");
          setConnecting(false);
        }
      } catch (error) {
        console.error('[wallet] Auto-authentication failed:', error);
        showError(error instanceof Error ? error.message : 'Authentication failed');
        setStep("connect");
        setConnecting(false);
      }
    };

    autoAuthenticate();
  }, [open, connected, publicKey]);

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

  // Monitor wallet connection during registration
  useEffect(() => {
    if (step === "register" && !connected) {
      toast.warning("Wallet disconnected. Please reconnect to continue.");
      setStep("connect");
    }
  }, [connected, step]);


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

      // Check if already connected with this wallet
      if (connected && publicKey) {
        console.info('[wallet] Already connected, proceeding to auth check...');
        setStep("checking");
        
        const address = publicKey.toBase58();
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
          console.info('[wallet] Sign-in failed, falling back to registration', (result as any)?.error);
          toast.error((result as any)?.error || "Sign-in failed. Please complete quick registration.");
          setStep("register");
        }
        setConnecting(false);
        setSelectedWallet(null);
        return;
      }

      // If switching wallets, disconnect and clear cache FIRST
      if (connected) {
        console.info('[wallet] Disconnecting existing wallet');
        await disconnect().catch(() => {});
        await clearWalletStorage();
        // Small delay for cleanup
        await new Promise(r => setTimeout(r, 200));
      }

      // Select the wallet
      console.info('[wallet] Selecting wallet:', walletName);
      select(walletName);

      // Get the adapter
      const wallet = wallets.find(w => w.adapter.name === walletName);
      if (!wallet) {
        throw new Error("Wallet adapter not found. Please refresh and try again.");
      }

      // If in an iframe, show early hint about popup blockers
      if (isIframed) {
        setTimeout(() => {
          if (!wallet.adapter.connected) {
            toast.info("Wallet popup may be blocked in an embedded view.", {
              action: { label: "Open in New Window", onClick: openInNewWindow } as any,
            } as any);
          }
        }, 1500);
      }

      // Connect via adapter directly
      console.info('[wallet] Calling adapter.connect()...');
      await withTimeout(wallet.adapter.connect(), 20000);

      // Wait for adapter to emit connect event
      console.info('[wallet] Waiting for adapter connect event...');
      const isConnected = await waitForAdapterConnected(wallet.adapter, 20000);
      if (!isConnected) {
        throw new Error("Wallet did not finish connecting in time. Please approve in your wallet.");
      }

      console.info('[wallet] Adapter connected successfully');

      // Optional: request a message signature if supported
      try {
        const adapterAny = wallet.adapter as any;
        if (adapterAny && typeof adapterAny.signMessage === 'function' && wallet.adapter.publicKey) {
          console.info('[wallet] Requesting message signature...');
          const encoder = new TextEncoder();
          const nonce = Math.random().toString(36).slice(2);
          const msg = `LUVAI Sign-In\nAddress: ${wallet.adapter.publicKey.toBase58()}\nNonce: ${nonce}\nDomain: ${window.location.host}\nTime: ${new Date().toISOString()}`;
          await withTimeout(adapterAny.signMessage(encoder.encode(msg)), 20000);
          console.info('[wallet] Message signed');
        } else {
          console.info('[wallet] Wallet does not support signMessage; skipping');
        }
      } catch (sigErr) {
        console.warn('[wallet] Message signing skipped/failed:', sigErr);
      }

      // Proceed to account check
      console.info('[wallet] Connection successful, checking account...');
      setStep("checking");

      const address = wallet.adapter.publicKey!.toBase58();
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
        console.info('[wallet] Sign-in failed, falling back to registration', (result as any)?.error);
        toast.error((result as any)?.error || "Sign-in failed. Please complete quick registration.");
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
    // Explicit wallet connection check
    if (!walletAddress) {
      toast.error("Wallet disconnected! Please reconnect your wallet and try again.");
      setStep("connect");
      return;
    }

    if (!username || !displayName) {
      toast.error("Please fill in all required fields");
      return;
    }

    const validationError = validateUsername(username);
    if (validationError || usernameError) {
      toast.error(validationError || usernameError || "Please fix errors before continuing");
      return;
    }

    try {
      setIsRegistering(true);
      console.info('[wallet] Registering new user:', { username, displayName, walletAddress });

      const result = await registerWithWallet(walletAddress, username, displayName);

      if (result.success) {
        console.info('[wallet] Registration successful');
        toast.success("Welcome to LUVAI! 💜");
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

  const forcePhantomPopup = async () => {
    try {
      const anyWindow = window as any;
      const phantom = anyWindow?.phantom?.solana || anyWindow?.solana;
      if (phantom?.isPhantom && typeof phantom.connect === "function") {
        await phantom.connect({ onlyIfTrusted: false });
      } else {
        toast.error("Phantom not detected.");
      }
    } catch (e: any) {
      showError(e);
    }
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
              {phantomWallet && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={forcePhantomPopup}
                  className="w-full"
                >
                  Force Phantom Popup
                </Button>
              )}
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
