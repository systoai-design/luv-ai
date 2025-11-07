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
      const email = emailFor(walletAddress);
      const password = createWalletPassword(walletAddress);

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

      // If sign in fails, try to sign up
      if (signInError.message.includes("Invalid login credentials")) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              wallet_address: walletAddress,
              username: `user_${walletAddress.slice(0, 6)}`,
              display_name: `anon-${walletAddress.slice(0, 4)}`,
            },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (!signUpError) {
          toast.success("Welcome to LUVAI! 💜");
          navigate("/home");
          return { success: true };
        }

        // If user already registered, retry sign in
        if (signUpError.message.includes("User already registered")) {
          const { error: retryError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (!retryError) {
            toast.success("Welcome back! 💜");
            navigate("/home");
            return { success: true };
          }

          toast.error("Authentication failed. Please try again.");
          return { success: false, error: retryError.message };
        }

        toast.error(signUpError.message);
        return { success: false, error: signUpError.message };
      }

      toast.error(signInError.message);
      return { success: false, error: signInError.message };
    } catch (error: any) {
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
