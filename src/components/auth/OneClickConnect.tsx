import { useEffect } from "react";
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

  useEffect(() => {
    if (connected && publicKey && !user && !isAuthenticating) {
      signInOrSignUp(publicKey.toBase58());
    }
  }, [connected, publicKey, user, isAuthenticating]);

  return (
    <WalletMultiButton className={className} />
  );
};

export default OneClickConnect;
