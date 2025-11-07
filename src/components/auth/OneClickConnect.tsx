import { useEffect, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useOneClickWalletAuth } from "@/hooks/useOneClickWalletAuth";
import { useAuth } from "@/contexts/AuthContext";

interface OneClickConnectProps {
  className?: string;
}

const OneClickConnect = ({ className }: OneClickConnectProps) => {
  const { connected, publicKey } = useWallet();
  const { signInOrSignUp, isAuthenticating } = useOneClickWalletAuth();
  const { user } = useAuth();
  const attemptedWalletRef = useRef<string | null>(null);

  useEffect(() => {
    if (connected && publicKey && !user && !isAuthenticating) {
      const walletAddress = publicKey.toBase58();
      
      // Prevent duplicate authentication attempts for the same wallet
      if (attemptedWalletRef.current === walletAddress) {
        return;
      }
      
      attemptedWalletRef.current = walletAddress;
      signInOrSignUp(walletAddress);
    }
  }, [connected, publicKey, user, isAuthenticating]);

  return (
    <WalletMultiButton className={className} />
  );
};

export default OneClickConnect;
