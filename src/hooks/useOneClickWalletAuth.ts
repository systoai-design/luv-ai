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

      console.log('[OneClick] Attempting sign in for:', normalizedAddress);

      // First attempt: try normalized credentials
      let { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // If normalized failed, try legacy (original case) credentials
      if (signInError?.message.includes("Invalid login credentials")) {
        console.log('[OneClick] Normalized credentials failed, trying legacy credentials');
        const legacyEmail = emailFor(walletAddress); // Original case
        const legacyPassword = createWalletPassword(walletAddress); // Original case

        const legacyResult = await supabase.auth.signInWithPassword({
          email: legacyEmail,
          password: legacyPassword,
        });

        if (!legacyResult.error) {
          console.log('[OneClick] Legacy credentials successful, normalizing wallet address');
          signInError = null;
          
          // Normalize the wallet_address in profile for future logins
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ wallet_address: normalizedAddress })
            .eq('wallet_address', walletAddress);

          if (updateError) {
            console.error('[OneClick] Failed to normalize wallet address:', updateError);
          }
        } else {
          signInError = legacyResult.error;
        }
      }

      if (!signInError) {
        console.log('[OneClick] Sign in successful');
        toast.success("Welcome back! 💜");
        navigate("/home");
        return { success: true };
      }

      console.error('[OneClick] Sign in error:', signInError.message);

      // Check for rate limiting
      if (signInError.message.includes("rate limit") || signInError.message.includes("too many")) {
        toast.error("Too many login attempts. Please wait 60 seconds and try again.", {
          duration: 8000,
        });
        return { success: false, error: "rate_limit" };
      }

      // If invalid credentials, user might need to register
      if (signInError.message.includes("Invalid login credentials")) {
        console.log('[OneClick] Invalid credentials - user may need to register');
        return { success: false, error: "invalid_credentials" };
      }

      toast.error("Sign in failed. Please try again.");
      return { success: false, error: signInError.message };
    } catch (error: any) {
      console.error('[OneClick] Exception:', error);
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
