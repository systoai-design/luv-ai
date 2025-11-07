import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { WalletConnectPanel } from "@/components/wallet/WalletConnectPanel";
import { clearWalletStorage } from "@/lib/walletReset";
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
import { Loader2, Check, X, WifiOff } from "lucide-react";

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
  const { connected, publicKey } = useWallet();
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
  const [loadingState, setLoadingState] = useState<'idle' | 'creating' | 'success'>('idle');
  const [connectionError, setConnectionError] = useState<string | null>(null);


  // Reset state and clear wallet cache when modal opens/closes
  useEffect(() => {
    if (!open) {
      setStep("connect");
      setUsername("");
      setDisplayName("");
      setUsernameError("");
      setUsernameAvailable(null);
      setLoadingState('idle');
      setConnectionError(null);
    } else if (step === "connect") {
      // Aggressively clear wallet cache when opening to connect
      clearWalletStorage();
    }
  }, [open, step]);

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

    const result = await registerWithWallet(walletAddress, username, displayName);

    setIsSubmitting(false);

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
    handleRegister();
  };

  // Loading state messages
  const loadingMessages = {
    idle: '',
    creating: 'Creating your profile...',
    success: 'Success! Redirecting...'
  };

  // Progress value based on loading state
  const getProgressValue = () => {
    switch (loadingState) {
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
                Connect your Solana wallet to get started
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <WalletConnectPanel onConnected={() => {
                console.info('[auth] Wallet connected, advancing to registration');
                setStep("register");
              }} />
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
                  <WifiOff className="h-4 w-4" />
                  <AlertTitle>Registration Failed</AlertTitle>
                  <AlertDescription className="space-y-2">
                    <p>{connectionError}</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleRetryConnection}
                      className="w-full"
                    >
                      Try Again
                    </Button>
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
