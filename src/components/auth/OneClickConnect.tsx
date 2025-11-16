import { useEffect, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useOneClickWalletAuth } from "@/hooks/useOneClickWalletAuth";
import { useAuth } from "@/contexts/AuthContext";
import { WalletAuthModal } from "./WalletAuthModal";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

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

        console.log('[OneClickConnect] Wallet connected:', walletAddress);

        // Check if this is a new user
        const isNew = await checkIfNewUser(walletAddress);
        
        if (isNew) {
          console.log('[OneClickConnect] New user detected, opening registration modal');
          // New user - open WalletAuthModal for registration
          setShowWalletModal(true);
          onNewUser?.();
        } else {
          console.log('[OneClickConnect] Existing user, attempting auto sign-in');
          // Existing user - sign in directly
          const result = await signInExistingUser(walletAddress);
          
          if (!result.success && result.error === "invalid_credentials") {
            console.log('[OneClickConnect] Auto sign-in failed, opening registration modal');
            toast.info("Please complete your profile setup");
            setShowWalletModal(true);
            onNewUser?.();
          }
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
      connectionIntent="authenticate"
    />
  );
};

export default OneClickConnect;
