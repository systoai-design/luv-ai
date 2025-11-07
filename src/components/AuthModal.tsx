import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Check, X, AlertCircle, Wifi, WifiOff } from "lucide-react";

// Simple validation function
const validateUsername = (username: string): string | null => {
  if (username.length < 3) return "Username must be at least 3 characters";
  if (username.length > 20) return "Username must be less than 20 characters";
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return "Username can only contain letters, numbers, and underscores";
  }
  return null;
};

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const AuthModal = ({ open, onOpenChange, onSuccess }: AuthModalProps) => {
  const { connected, publicKey, connect, wallet, wallets, select } = useWallet();
  const {
    authState,
    checkUsernameAvailable,
    registerWithWallet,
    walletAddress,
  } = useWalletAuth();

  const [step, setStep] = useState<"connect" | "register">("connect");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [loadingState, setLoadingState] = useState<'idle' | 'connecting' | 'verifying' | 'creating' | 'success'>('idle');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);

  // Log wallet state for debugging
  useEffect(() => {
    console.log('Wallet state:', { 
      connected, 
      publicKey: publicKey?.toBase58(),
      wallet: wallet?.adapter?.name,
      availableWallets: wallets.map(w => w.adapter.name)
    });
  }, [connected, publicKey, wallet, wallets]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setStep("connect");
      setUsername("");
      setDisplayName("");
      setUsernameError("");
      setUsernameAvailable(null);
      setLoadingState('idle');
      setConnectionError(null);
      setIsConnecting(false);
      
      // Force wallet selector reset by clearing selection
      if (select) {
        (select as any)(null);
      }
    }
  }, [open, select]);

  // Move to registration if new user and wallet connected
  useEffect(() => {
    if (connected && authState.isNewUser && step === "connect") {
      setStep("register");
    }
  }, [connected, authState.isNewUser, step]);

  // Check username availability with debounce
  useEffect(() => {
    if (!username) {
      setUsernameAvailable(null);
      setUsernameError("");
      return;
    }

    // Validate username format
    const validationError = validateUsername(username);
    if (validationError) {
      setUsernameError(validationError);
      setUsernameAvailable(false);
      return;
    }

    setUsernameError("");
    setIsCheckingUsername(true);

    const timeoutId = setTimeout(async () => {
      const available = await checkUsernameAvailable(username);
      setUsernameAvailable(available);
      setIsCheckingUsername(false);
      if (!available) {
        setUsernameError("Username is already taken");
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [username]);

  const handleRegister = async () => {
    if (!walletAddress || !usernameAvailable || !username || !displayName) {
      return;
    }
    
    if (!connected) {
      setUsernameError("Wallet disconnected. Please reconnect.");
      return;
    }

    setIsSubmitting(true);
    setLoadingState('creating');
    setConnectionError(null);
    setShowTimeoutWarning(false);
    
    // Show timeout warning after 10 seconds
    const timeoutId = setTimeout(() => {
      setShowTimeoutWarning(true);
    }, 10000);

    const result = await registerWithWallet(walletAddress, username, displayName);

    clearTimeout(timeoutId);
    setIsSubmitting(false);
    setLoadingState('idle');
    setShowTimeoutWarning(false);

    if (result.success) {
      setLoadingState('success');
      setTimeout(() => {
        onOpenChange(false);
        onSuccess?.();
      }, 500);
    } else if (result.error) {
      setConnectionError(result.error);
    }
  };

  const handleRetryConnection = () => {
    setConnectionError(null);
    setShowTimeoutWarning(false);
    if (step === 'register') {
      handleRegister();
    }
  };

  const handleConnectWallet = async (walletName?: string) => {
    try {
      setIsConnecting(true);
      setLoadingState('connecting');
      setConnectionError(null);
      console.log('Attempting to connect wallet:', walletName || 'current');
      
      if (walletName) {
        // Select specific wallet by name (using as any to bypass type restrictions)
        (select as any)(walletName);
        // Wait a bit for the adapter to be ready
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      setLoadingState('verifying');
      await connect();
      console.log('Wallet connected successfully');
      setLoadingState('success');
    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      setConnectionError(error?.message || 'Failed to connect wallet');
      setLoadingState('idle');
    } finally {
      setIsConnecting(false);
    }
  };

  // Loading state messages
  const loadingMessages = {
    idle: '',
    connecting: 'Connecting to wallet...',
    verifying: 'Verifying wallet signature...',
    creating: 'Creating your profile...',
    success: 'Success! Redirecting...'
  };

  // Progress value based on loading state
  const getProgressValue = () => {
    switch (loadingState) {
      case 'connecting': return 25;
      case 'verifying': return 50;
      case 'creating': return 75;
      case 'success': return 100;
      default: return 0;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-md"
        onInteractOutside={(e) => {
          // Only prevent closing during submission
          if (isSubmitting) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          // Only prevent closing during submission
          if (isSubmitting) e.preventDefault();
        }}
      >
        {step === "connect" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Welcome to LUVAI
              </DialogTitle>
              <DialogDescription>
                Connect your Phantom wallet to get started
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center gap-6 py-6">
              {wallets.length === 0 ? (
                <div className="text-center space-y-4">
                  <p className="text-muted-foreground">
                    No wallet detected. Please install a Solana wallet extension.
                  </p>
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => window.open('https://phantom.app/', '_blank')}
                      className="bg-gradient-primary"
                    >
                      Install Phantom
                    </Button>
                    <Button
                      onClick={() => window.open('https://solflare.com/', '_blank')}
                      variant="outline"
                    >
                      Install Solflare
                    </Button>
                    <Button
                      onClick={() => window.open('https://backpack.app/', '_blank')}
                      variant="outline"
                    >
                      Install Backpack
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-full space-y-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-4">
                        Connect with one of these wallets:
                      </p>
                    </div>
                    
                    {/* Direct connect buttons for detected wallets */}
                    <div className="flex flex-col gap-2">
                      {wallets.map((w) => (
                        <Button
                          key={w.adapter.name}
                          onClick={() => handleConnectWallet(w.adapter.name)}
                          disabled={isConnecting || connected}
                          className="w-full bg-gradient-primary hover:opacity-90"
                          size="lg"
                        >
                          {isConnecting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Connecting...
                            </>
                          ) : (
                            <>Connect {w.adapter.name}</>
                          )}
                        </Button>
                      ))}
                    </div>

                    {/* Fallback: Original WalletMultiButton */}
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                          Or use wallet modal
                        </span>
                      </div>
                    </div>
                    
                    <div className="wallet-adapter-button-container flex justify-center">
                      <WalletMultiButton />
                    </div>
                  </div>
                </>
              )}
              <p className="text-sm text-muted-foreground text-center">
                Don't have a wallet?{" "}
                <a
                  href="https://phantom.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Get Phantom
                </a>
                {" · "}
                <a
                  href="https://solflare.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Get Solflare
                </a>
                {" · "}
                <a
                  href="https://backpack.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Get Backpack
                </a>
              </p>
            </div>
          </>
        )}

        {step === "register" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Complete Your Profile
              </DialogTitle>
              <DialogDescription>
                Choose your username and display name
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="username">
                  Username <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="username"
                    placeholder="cooluser123"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    className={
                      usernameError
                        ? "border-destructive"
                        : usernameAvailable
                        ? "border-green-500"
                        : ""
                    }
                  />
                  {isCheckingUsername && (
                    <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                  {!isCheckingUsername && usernameAvailable === true && (
                    <Check className="absolute right-3 top-3 h-4 w-4 text-green-500" />
                  )}
                  {!isCheckingUsername && usernameAvailable === false && (
                    <X className="absolute right-3 top-3 h-4 w-4 text-destructive" />
                  )}
                </div>
                {usernameError && (
                  <p className="text-sm text-destructive">{usernameError}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  3-20 characters, letters, numbers, and underscores only
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">
                  Display Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="displayName"
                  placeholder="Cool User"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  This is how others will see you
                </p>
              </div>

              {!connected && (
                <Alert variant="destructive">
                  <WifiOff className="h-4 w-4" />
                  <AlertTitle>Wallet Disconnected</AlertTitle>
                  <AlertDescription>
                    Please reconnect your wallet to complete registration.
                  </AlertDescription>
                </Alert>
              )}

              {connectionError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Connection Failed</AlertTitle>
                  <AlertDescription className="space-y-3">
                    <p>{connectionError}</p>
                    <div className="text-sm">
                      <p className="font-semibold mb-1">Troubleshooting:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>Ensure your wallet is installed and unlocked</li>
                        <li>Check your internet connection</li>
                        <li>Try refreshing the page</li>
                        <li>Make sure you have approved the connection</li>
                      </ul>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleRetryConnection}
                      className="w-full mt-2"
                    >
                      Try Again
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {showTimeoutWarning && isSubmitting && !connectionError && (
                <Alert>
                  <Wifi className="h-4 w-4" />
                  <AlertTitle>Taking Longer Than Usual</AlertTitle>
                  <AlertDescription>
                    The connection is still in progress. Please wait a moment...
                  </AlertDescription>
                </Alert>
              )}

              {/* Progress indicator */}
              {isSubmitting && !connectionError && (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">
                      {loadingMessages[loadingState]}
                    </p>
                  </div>
                  <Progress value={getProgressValue()} className="h-2" />
                </div>
              )}

              <Button
                onClick={handleRegister}
                disabled={
                  usernameAvailable !== true ||
                  !username ||
                  !displayName ||
                  isSubmitting ||
                  isCheckingUsername ||
                  !connected
                }
                className="w-full bg-gradient-primary hover:opacity-90"
              >
                {loadingState === 'success' ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Success!
                  </>
                ) : isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {loadingMessages[loadingState]}
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
