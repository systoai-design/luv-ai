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

  return (
    <div className="flex flex-col items-center gap-4">
      <WalletMultiButton className={className} />
      
      {isInIframe && (
        <a
          href={window.location.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Having issues? Open in new window →
        </a>
      )}
    </div>
  );
};

export default OneClickConnect;
