import { useEffect, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useOneClickWalletAuth } from "@/hooks/useOneClickWalletAuth";
import { useAuth } from "@/contexts/AuthContext";
import { WalletAuthModal } from "./WalletAuthModal";
import { useNavigate } from "react-router-dom";

interface OneClickConnectProps {
  className?: string;
  onNewUser?: () => void;
}

const OneClickConnect = ({ className, onNewUser }: OneClickConnectProps) => {
  const { connected, publicKey } = useWallet();
  const { checkIfNewUser, signInExistingUser, isAuthenticating } = useOneClickWalletAuth();
  const { user } = useAuth();
  const navigate = useNavigate();
  const attemptedWalletRef = useRef<string | null>(null);
  const [showWalletModal, setShowWalletModal] = useState(false);

  useEffect(() => {
    const handleWalletConnection = async () => {
      if (connected && publicKey && !user && !isAuthenticating) {
        const walletAddress = publicKey.toBase58().toLowerCase();
        
        // Prevent duplicate authentication attempts for the same wallet
        if (attemptedWalletRef.current === walletAddress) {
          return;
        }
        
        attemptedWalletRef.current = walletAddress;

        // Check if this is a new user
        const isNew = await checkIfNewUser(walletAddress);
        
        if (isNew) {
          // New user - open WalletAuthModal for registration
          setShowWalletModal(true);
          onNewUser?.();
        } else {
          // Existing user - sign in directly
          await signInExistingUser(walletAddress);
        }
      }
    };

    handleWalletConnection();
  }, [connected, publicKey, user, isAuthenticating]);

  return (
    <WalletAuthModal 
      open={showWalletModal} 
      onOpenChange={setShowWalletModal}
      onSuccess={() => navigate("/home")}
    />
  );
};

export default OneClickConnect;
