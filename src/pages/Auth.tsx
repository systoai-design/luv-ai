import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Loader2, Wallet as WalletIcon, Mail, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletName } from "@solana/wallet-adapter-base";
import { WalletAuthModal } from "@/components/auth/WalletAuthModal";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

const emailSchema = z.string().email("Invalid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

const Auth = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { wallets, select } = useWallet();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [emailExpanded, setEmailExpanded] = useState(false);

  useEffect(() => {
    if (user) {
      navigate("/home");
    }
  }, [user, navigate]);

  const validateInputs = (isSignUp: boolean) => {
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
      if (isSignUp && !displayName.trim()) {
        throw new Error("Display name is required");
      }
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else if (error instanceof Error) {
        toast.error(error.message);
      }
      return false;
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateInputs(true)) return;

    setLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
            username: `user_${email.split('@')[0]}_${Date.now()}`,
          },
          emailRedirectTo: redirectUrl
        }
      });

      if (error) throw error;

      toast.success("Account created! Welcome to LUVAI! 💜");
      navigate("/home");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(resetEmail);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
      return;
    }

    setLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: redirectUrl,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      setShowResetConfirmation(true);
      setShowResetPassword(false);
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateInputs(false)) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success("Welcome back! 💜");
      navigate("/home");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Wallet connection handlers
  const handleWalletConnect = (walletName: WalletName) => {
    select(walletName);
    setShowWalletModal(true);
  };

  const availableWallets = wallets.filter(w => w.readyState === "Installed" || w.readyState === "Loadable");
  const phantomWallet = availableWallets.find(w => w.adapter.name === "Phantom");
  const solflareWallet = availableWallets.find(w => w.adapter.name === "Solflare");

  // Reset password confirmation screen
  if (showResetConfirmation) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Mail className="h-12 w-12 text-primary" />
            </div>
            <CardTitle>Reset Link Sent</CardTitle>
            <CardDescription>
              Check your email for the password reset link
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                A password reset link has been sent to <strong>{resetEmail}</strong>. 
                Click the link in the email to create a new password.
              </AlertDescription>
            </Alert>
            <Button
              variant="outline"
              onClick={() => {
                setShowResetConfirmation(false);
                setResetEmail("");
              }}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Reset password form
  if (showResetPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Heart className="h-12 w-12 text-primary fill-primary" />
            </div>
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>
              Enter your email to receive a password reset link
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="you@example.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending link...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setShowResetPassword(false);
                    setResetEmail("");
                  }}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Sign In
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main auth screen with wallet-first UI
  return (
    <>
      <WalletAuthModal 
        open={showWalletModal} 
        onOpenChange={setShowWalletModal}
        onSuccess={() => navigate("/home")}
      />
      
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-2">
            <div className="flex justify-center mb-2">
              <Heart className="h-12 w-12 text-primary fill-primary" />
            </div>
            <CardTitle className="text-3xl font-bold">Welcome to LUVAI</CardTitle>
            <CardDescription>
              Connect your wallet to get started
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* PRIMARY: Wallet Connection */}
            <div className="space-y-3">
              {phantomWallet && (
                <Button
                  onClick={() => handleWalletConnect("Phantom" as WalletName)}
                  className="w-full h-14 text-base font-medium"
                  size="lg"
                >
                  <img src={phantomWallet.adapter.icon} alt="Phantom" className="mr-2 h-6 w-6" />
                  Connect with Phantom
                </Button>
              )}
              
              {solflareWallet && (
                <Button
                  onClick={() => handleWalletConnect("Solflare" as WalletName)}
                  variant="outline"
                  className="w-full h-14 text-base font-medium"
                  size="lg"
                >
                  <img src={solflareWallet.adapter.icon} alt="Solflare" className="mr-2 h-6 w-6" />
                  Connect with Solflare
                </Button>
              )}

              {availableWallets.length === 0 && (
                <Button
                  onClick={() => setShowWalletModal(true)}
                  className="w-full h-14 text-base font-medium"
                  size="lg"
                >
                  <WalletIcon className="mr-2 h-5 w-5" />
                  Connect Wallet
                </Button>
              )}
            </div>

            {/* SECONDARY: Email Option (Collapsible) */}
            <Collapsible open={emailExpanded} onOpenChange={setEmailExpanded}>
              <div className="relative">
                <Separator />
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs"
                  >
                    Or continue with email
                  </Button>
                </CollapsibleTrigger>
              </div>

              <CollapsibleContent className="pt-6">
                <Tabs defaultValue="signin" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="signin">Sign In</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="signin">
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signin-email">Email</Label>
                        <Input
                          id="signin-email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signin-password">Password</Label>
                        <Input
                          id="signin-password"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Signing in...
                          </>
                        ) : (
                          "Sign In"
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="link"
                        className="w-full text-xs"
                        onClick={() => setShowResetPassword(true)}
                      >
                        Forgot password?
                      </Button>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="signup">
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name">Display Name</Label>
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="Your name"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Must be at least 6 characters
                        </p>
                      </div>
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating account...
                          </>
                        ) : (
                          "Create Account"
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Auth;
