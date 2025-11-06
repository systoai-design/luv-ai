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
import { Loader2, Check, X } from "lucide-react";

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
}

export const AuthModal = ({ open, onOpenChange }: AuthModalProps) => {
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

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setStep("connect");
      setUsername("");
      setDisplayName("");
      setUsernameError("");
      setUsernameAvailable(null);
    }
  }, [open]);

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
  }, [username, checkUsernameAvailable]);

  const handleRegister = async () => {
    if (!walletAddress || !usernameAvailable || !username || !displayName) {
      return;
    }

    setIsSubmitting(true);
    const result = await registerWithWallet(walletAddress, username, displayName);
    setIsSubmitting(false);

    if (result.success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
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
              <div className="wallet-adapter-button-container">
                <WalletMultiButton />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Don't have a wallet?{" "}
                <a
                  href="https://phantom.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Download Phantom
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

              <Button
                onClick={handleRegister}
                disabled={
                  !usernameAvailable ||
                  !username ||
                  !displayName ||
                  isSubmitting ||
                  isCheckingUsername
                }
                className="w-full bg-gradient-primary hover:opacity-90"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Profile...
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
