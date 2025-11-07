import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

// Deterministic email and password from wallet address
const emailFor = (address: string) => `${address}@wallet.luvai.app`;
const createWalletPassword = (address: string) => `wallet_luvai_${address}`;

export const useOneClickWalletAuth = () => {
  const navigate = useNavigate();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const signInOrSignUp = async (walletAddress: string) => {
    if (isAuthenticating) return;
    
    setIsAuthenticating(true);
    
    try {
      // Normalize to lowercase for consistency
      const normalizedAddress = walletAddress.toLowerCase();
      
      const email = emailFor(normalizedAddress);
      const password = createWalletPassword(normalizedAddress);

      // Try to sign in first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!signInError) {
        toast.success("Welcome back! 💜");
        navigate("/home");
        return { success: true };
      }

      // Check for rate limiting
      if (signInError.message.includes("rate limit") || signInError.message.includes("too many")) {
        toast.error("Too many login attempts. Please wait 60 seconds and try again.", {
          duration: 8000,
        });
        return { success: false, error: "rate_limit" };
      }

      // If sign in fails, try to sign up
      if (signInError.message.includes("Invalid login credentials")) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              wallet_address: normalizedAddress,
              username: `user_${normalizedAddress.slice(0, 6)}`,
              display_name: `anon-${normalizedAddress.slice(0, 4)}`,
            },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (!signUpError) {
          toast.success("Welcome to LUVAI! 💜");
          navigate("/home");
          return { success: true };
        }

        // Check for rate limiting on sign up
        if (signUpError.message.includes("rate limit") || signUpError.message.includes("too many")) {
          toast.error("Too many registration attempts. Please wait 60 seconds and try again.", {
            duration: 8000,
          });
          return { success: false, error: "rate_limit" };
        }

        // If user already registered, this means the password doesn't match
        // Don't retry - this prevents the authentication loop
        if (signUpError.message.includes("User already registered")) {
          toast.error("Account exists but authentication failed. Please disconnect and try again or use email login.", {
            duration: 10000,
          });
          return { success: false, error: "password_mismatch" };
        }

        toast.error(signUpError.message);
        return { success: false, error: signUpError.message };
      }

      toast.error(signInError.message);
      return { success: false, error: signInError.message };
    } catch (error: any) {
      if (error.message?.includes("rate limit") || error.message?.includes("too many")) {
        toast.error("Too many attempts. Please wait 60 seconds and try again.", {
          duration: 8000,
        });
        return { success: false, error: "rate_limit" };
      }
      toast.error(error.message || "Authentication failed");
      return { success: false, error: error.message };
    } finally {
      setIsAuthenticating(false);
    }
  };

  return {
    signInOrSignUp,
    isAuthenticating,
  };
};
