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

  const isInIframe = window.self !== window.top;

  // If in iframe, open in new window instead
  if (isInIframe) {
    return (
      <div className="flex flex-col items-center gap-4">
        <button
          onClick={() => window.open(window.location.href, '_blank')}
          className={className}
        >
          Connect Wallet
        </button>
        <p className="text-sm text-muted-foreground">
          Opens in new window for wallet connection
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <WalletMultiButton className={className} />
    </div>
  );
};

export default OneClickConnect;
