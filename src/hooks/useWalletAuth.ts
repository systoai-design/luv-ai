import { useEffect, useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { clearWalletStorage } from "@/lib/walletReset";

interface WalletAuthState {
  isChecking: boolean;
  isNewUser: boolean;
  error: string | null;
}

// Helper function to create consistent deterministic password from wallet address
const createWalletPassword = (walletAddress: string): string => {
  return `wallet_luvai_${walletAddress.toLowerCase()}`;
};

export const useWalletAuth = () => {
  const { publicKey, connected, disconnect } = useWallet();
  const navigate = useNavigate();
  const [authState, setAuthState] = useState<WalletAuthState>({
    isChecking: false,
    isNewUser: false,
    error: null,
  });

  // Ensure wallet address is linked to profile (for legacy accounts)
  const ensureProfileWalletLink = async (walletAddress: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const normalizedAddress = walletAddress.toLowerCase();
      
      // Only update if wallet_address is null (don't overwrite existing)
      const { error } = await supabase
        .from("profiles")
        .update({ wallet_address: normalizedAddress })
        .eq("user_id", user.id)
        .is("wallet_address", null);

      if (error) {
        console.warn('[auth] Could not link wallet address:', error);
      } else {
        console.info('[auth] Wallet address linked to profile');
      }
    } catch (error) {
      console.warn('[auth] Error linking wallet:', error);
    }
  };

  // Check if wallet exists in database
  const checkWalletExists = async (walletAddress: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .ilike("wallet_address", walletAddress)
        .maybeSingle();

      if (error) throw error;
      return data ? (data as any) : null;
    } catch (error) {
      console.error("Error checking wallet:", error);
      return null;
    }
  };

  // Check username availability
  const checkUsernameAvailable = useCallback(async (username: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("username", username)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;
      return !data;
    } catch (error) {
      console.error("Error checking username:", error);
      return false;
    }
  }, []);

  // Register new user with wallet
  const registerWithWallet = async (
    walletAddress: string,
    username: string,
    displayName: string
  ) => {
    try {
      console.log('Step 1: Starting registration...', { walletAddress, username, displayName });
      
      // Validate wallet is still connected
      if (!publicKey || !connected) {
        throw new Error("Wallet disconnected. Please reconnect and try again.");
      }

      setAuthState({ isChecking: true, isNewUser: false, error: null });

      // Create deterministic email and password from wallet address (normalized)
      const normalizedAddress = walletAddress.toLowerCase();
      const email = `${normalizedAddress}@wallet.luvai.app`;
      const password = createWalletPassword(normalizedAddress);

      console.log('Step 2: Creating auth account...', { email });

      // Add timeout protection
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Registration timeout. Please try again.")), 10000)
      );

      // Sign up with Supabase - trigger will handle profile creation
      const signUpPromise = supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            wallet_address: normalizedAddress,
            username,
            display_name: displayName,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      const { data: authData, error: signUpError } = await Promise.race([
        signUpPromise,
        timeoutPromise
      ]) as any;

      if (signUpError) {
        console.error('Step 2 Failed:', signUpError);
        throw signUpError;
      }

      console.log('Step 3: Auth account created', { userId: authData.user?.id });

      // Wait a bit for the trigger to complete
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('Step 4: Registration complete!');
      
      toast.success("Welcome to LUVAI! 💜");
      setAuthState({ isChecking: false, isNewUser: false, error: null });
      return { success: true };
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error.message || "Registration failed";
      setAuthState({ isChecking: false, isNewUser: false, error: errorMessage });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Sign in existing wallet user
  const signInWithWallet = async (walletAddress: string) => {
    try {
      setAuthState({ isChecking: true, isNewUser: false, error: null });

      // Try to sign in first (login-first approach)
      const normalizedAddress = walletAddress.toLowerCase();
      const email = `${normalizedAddress}@wallet.luvai.app`;
      const password = createWalletPassword(normalizedAddress);

      // Attempt 1: Normalized credentials
      const { error: normalizedError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!normalizedError) {
        console.info('[auth] Signed in with normalized credentials');
        // Link wallet address to profile if not already linked (for legacy accounts)
        await ensureProfileWalletLink(normalizedAddress);
        toast.success("Welcome back! 💜");
        setAuthState({ isChecking: false, isNewUser: false, error: null });
        return { success: true, isNewUser: false };
      }

      // Attempt 2: Legacy raw-case credentials
      const rawEmail = `${walletAddress}@wallet.luvai.app`;
      const rawPassword = `wallet_luvai_${walletAddress}`;
      
      const { error: legacyError } = await supabase.auth.signInWithPassword({
        email: rawEmail,
        password: rawPassword,
      });

      if (!legacyError) {
        console.info('[auth] Signed in with legacy credentials');
        // Link wallet address to profile if not already linked
        await ensureProfileWalletLink(normalizedAddress);
        toast.success("Welcome back! 💜");
        setAuthState({ isChecking: false, isNewUser: false, error: null });
        return { success: true, isNewUser: false };
      }

      // Both login attempts failed - check if profile exists
      const profile = await checkWalletExists(walletAddress);
      
      if (!profile) {
        // Truly a new user
        console.info('[auth] New wallet user, showing registration');
        setAuthState({ isChecking: false, isNewUser: true, error: null });
        return { isNewUser: true };
      }

      // Profile exists but login failed - show helpful error
      console.warn('[auth] Profile exists but both login attempts failed');
      const errorMessage = "We found your wallet account but couldn't sign you in. Please tap 'Reset Wallet Cache' below and reconnect.";
      setAuthState({ isChecking: false, isNewUser: false, error: errorMessage });
      toast.error(errorMessage);
      return { 
        success: false, 
        isNewUser: false,
        error: errorMessage
      };
    } catch (error: any) {
      const errorMessage = error.message || "Sign in failed";
      setAuthState({ isChecking: false, isNewUser: false, error: errorMessage });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Handle wallet connection - removed premature profile check
  // Let signInWithWallet handle the logic instead

  // Handle wallet disconnection
  const handleDisconnect = async () => {
    try {
      console.info('[auth] Starting disconnect flow');
      
      // Sign out from Supabase first
      await supabase.auth.signOut();
      
      // Disconnect wallet
      if (connected) {
        await disconnect().catch(() => {});
      }
      
      // Aggressively clear all wallet-related cache
      await clearWalletStorage();
      
      // Small delay to ensure state clears
      await new Promise(resolve => setTimeout(resolve, 150));
      
      console.info('[auth] Disconnect complete');
      toast.success("Disconnected successfully");
      navigate("/");
    } catch (error) {
      console.error('[auth] Error disconnecting:', error);
      toast.error("Error disconnecting");
    }
  };

  return {
    authState,
    checkUsernameAvailable,
    registerWithWallet,
    signInWithWallet,
    handleDisconnect,
    walletAddress: publicKey?.toBase58(),
  };
};
