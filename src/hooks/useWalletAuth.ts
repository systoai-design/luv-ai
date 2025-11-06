import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface WalletAuthState {
  isChecking: boolean;
  isNewUser: boolean;
  error: string | null;
}

export const useWalletAuth = () => {
  const { publicKey, connected, disconnect } = useWallet();
  const navigate = useNavigate();
  const [authState, setAuthState] = useState<WalletAuthState>({
    isChecking: false,
    isNewUser: false,
    error: null,
  });

  // Check if wallet exists in database
  const checkWalletExists = async (walletAddress: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("wallet_address", walletAddress)
        .maybeSingle();

      if (error) throw error;
      return data ? (data as any) : null;
    } catch (error) {
      console.error("Error checking wallet:", error);
      return null;
    }
  };

  // Check username availability
  const checkUsernameAvailable = async (username: string): Promise<boolean> => {
    try {
      // Use raw query to avoid type inference issues with new column
      const query = (supabase as any)
        .from("profiles")
        .select("user_id")
        .eq("username", username)
        .maybeSingle();
      
      const { data, error } = await query;

      if (error && error.code !== "PGRST116") throw error;
      return !data;
    } catch (error) {
      console.error("Error checking username:", error);
      return false;
    }
  };

  // Register new user with wallet
  const registerWithWallet = async (
    walletAddress: string,
    username: string,
    displayName: string
  ) => {
    try {
      setAuthState({ isChecking: true, isNewUser: false, error: null });

      // Create deterministic email from wallet address
      const email = `${walletAddress}@wallet.luvai.app`;
      const password = `wallet_${walletAddress}_${Date.now()}`;

      // Sign up with Supabase
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            wallet_address: walletAddress,
            username,
            display_name: displayName,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (signUpError) throw signUpError;

      // Update profile with wallet address and username
      if (authData.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            wallet_address: walletAddress,
            username,
            display_name: displayName,
          })
          .eq("user_id", authData.user.id);

        if (profileError) throw profileError;
      }

      toast.success("Welcome to LUVAI! 💜");
      setAuthState({ isChecking: false, isNewUser: false, error: null });
      return { success: true };
    } catch (error: any) {
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

      // For existing users, we need to sign them in
      // Since we don't store the password, we use the wallet signature as verification
      const email = `${walletAddress}@wallet.luvai.app`;
      
      // Check if profile exists
      const profile = await checkWalletExists(walletAddress);
      if (!profile) {
        setAuthState({ isChecking: false, isNewUser: true, error: null });
        return { isNewUser: true };
      }

      toast.success("Welcome back! 💜");
      setAuthState({ isChecking: false, isNewUser: false, error: null });
      return { success: true, isNewUser: false };
    } catch (error: any) {
      const errorMessage = error.message || "Sign in failed";
      setAuthState({ isChecking: false, isNewUser: false, error: errorMessage });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Handle wallet connection
  useEffect(() => {
    if (connected && publicKey) {
      const walletAddress = publicKey.toBase58();
      checkWalletExists(walletAddress).then((profile) => {
        if (!profile) {
          setAuthState({ isChecking: false, isNewUser: true, error: null });
        }
      });
    }
  }, [connected, publicKey]);

  // Handle wallet disconnection
  const handleDisconnect = async () => {
    try {
      await supabase.auth.signOut();
      if (connected) {
        await disconnect();
      }
      toast.success("Disconnected successfully");
      navigate("/");
    } catch (error) {
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
