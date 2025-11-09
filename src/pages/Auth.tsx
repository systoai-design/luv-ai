import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Loader2, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { z } from "zod";
import OneClickConnect from "@/components/auth/OneClickConnect";
import { Separator } from "@/components/ui/separator";
import { useWallet } from "@solana/wallet-adapter-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const emailSchema = z.string().email("Invalid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

const Auth = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { select, wallets, connect, connected } = useWallet();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);

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
          emailRedirectTo: redirectUrl,
          data: {
            display_name: displayName,
          },
        },
      });

      if (error) {
        if (error.message.includes("rate limit") || error.message.includes("too many")) {
          toast.error("Too many registration attempts. Please wait 60 seconds before trying again.", {
            duration: 8000,
          });
        } else if (error.message.includes("already registered")) {
          toast.error("This email is already registered. Please sign in instead.");
        } else {
          toast.error(error.message);
        }
        return;
      }

      setConfirmationEmail(email);
      setShowConfirmation(true);
      setEmail("");
      setPassword("");
      setDisplayName("");
    } catch (error) {
      toast.error("An unexpected error occurred");
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

      if (error) {
        if (error.message.includes("rate limit") || error.message.includes("too many")) {
          toast.error("Too many login attempts. Please wait 60 seconds before trying again.", {
            duration: 8000,
          });
        } else if (error.message.includes("Invalid login credentials")) {
          toast.error("Invalid email or password");
        } else if (error.message.includes("Email not confirmed")) {
          toast.error("Please confirm your email before signing in. Check your inbox.");
        } else {
          toast.error(error.message);
        }
        return;
      }

      // Auto-connect wallet after successful email login
      if (!connected && wallets.length > 0) {
        try {
          const wallet = wallets[0];
          select(wallet.adapter.name);
          await connect();
          toast.success("Welcome back! Wallet connected.");
        } catch (walletError) {
          console.error("Wallet auto-connect failed:", walletError);
          toast.success("Welcome back!");
        }
      } else {
        toast.success("Welcome back!");
      }
      
      navigate("/home");
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (showResetConfirmation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
        <Card className="w-full max-w-md bg-card/95 backdrop-blur-sm border-primary/30">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Mail className="h-12 w-12 text-primary animate-pulse" />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Reset Link Sent
            </CardTitle>
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
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Didn't receive the email? Check your spam folder.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setShowResetConfirmation(false);
                  setResetEmail("");
                }}
                className="w-full"
              >
                Back to Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showConfirmation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
        <Card className="w-full max-w-md bg-card/95 backdrop-blur-sm border-primary/30">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Mail className="h-12 w-12 text-primary animate-pulse" />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Check Your Email
            </CardTitle>
            <CardDescription>
              We've sent a confirmation link to your email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                A confirmation email has been sent to <strong>{confirmationEmail}</strong>. 
                Please check your inbox and click the link to verify your account.
              </AlertDescription>
            </Alert>
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Didn't receive the email? Check your spam folder.
              </p>
              <Button
                variant="outline"
                onClick={() => setShowConfirmation(false)}
                className="w-full"
              >
                Back to Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showResetPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
        <Card className="w-full max-w-md bg-card/95 backdrop-blur-sm border-primary/30">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Heart className="h-12 w-12 text-primary fill-primary animate-glow" />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Reset Password
            </CardTitle>
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
                  className="w-full bg-gradient-primary"
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
                  Back to Sign In
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <Card className="w-full max-w-md bg-card/95 backdrop-blur-sm border-primary/30">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Heart className="h-12 w-12 text-primary fill-primary animate-glow" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Welcome to LUVAI
          </CardTitle>
          <CardDescription>
            Connect, chat, and discover meaningful relationships
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <OneClickConnect className="!w-full !bg-gradient-to-r !from-primary !via-purple-500 !to-pink-500 hover:!shadow-glow !text-primary-foreground !py-3 !rounded-lg !transition-all !duration-300 !font-medium" />
            
            <div className="relative my-6">
              <Separator />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-card px-2 text-xs text-muted-foreground">
                  Or continue with email
                </span>
              </div>
            </div>
          </div>

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
                  className="w-full bg-gradient-primary"
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
                  className="w-full text-xs text-muted-foreground hover:text-primary"
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
                  className="w-full bg-gradient-primary"
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
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
