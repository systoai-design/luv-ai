import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

// Deterministic email and password from wallet address (normalized)
const emailFor = (address: string) => `${address.toLowerCase()}@wallet.luvai.app`;
const createWalletPassword = (address: string) => `wallet_luvai_${address.toLowerCase()}`;

export const useOneClickWalletAuth = () => {
  const navigate = useNavigate();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const checkIfNewUser = async (walletAddress: string) => {
    // Check if profile exists with this wallet address (case-insensitive)
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .ilike("wallet_address", walletAddress)
      .maybeSingle();

    return !profile;
  };

  const signInExistingUser = async (walletAddress: string) => {
    if (isAuthenticating) return { success: false };
    
    setIsAuthenticating(true);
    
    try {
      const normalizedAddress = walletAddress.toLowerCase();
      const email = emailFor(normalizedAddress);
      const password = createWalletPassword(normalizedAddress);

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

      toast.error("Sign in failed. Please try again.");
      return { success: false, error: signInError.message };
    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
      return { success: false, error: error.message };
    } finally {
      setIsAuthenticating(false);
    }
  };

  return {
    checkIfNewUser,
    signInExistingUser,
    isAuthenticating,
  };
};
