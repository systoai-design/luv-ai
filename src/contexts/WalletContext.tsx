import { createContext, useContext, useMemo, ReactNode } from 'react';
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { 
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

const WalletContext = createContext({});

export const useWalletContext = () => useContext(WalletContext);

export const WalletContextProvider = ({ children }: { children: ReactNode }) => {
  // Use devnet for development
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  
  // Configure wallet adapters (removed Backpack temporarily for stability)
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  const onError = (error: any) => {
    console.error('Wallet adapter error:', error);
  };

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect={false} onError={onError}>
        <WalletModalProvider>
          <WalletContext.Provider value={{}}>
            {children}
          </WalletContext.Provider>
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
};
