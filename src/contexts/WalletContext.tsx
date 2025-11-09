import { createContext, useContext, useMemo, ReactNode } from 'react';
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { clusterApiUrl, Connection } from '@solana/web3.js';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

const WalletContext = createContext({});

export const useWalletContext = () => useContext(WalletContext);

// Export shared connection instance to avoid creating multiple connections
export let sharedConnection: Connection;

export const WalletContextProvider = ({ children }: { children: ReactNode }) => {
  // Support cluster override via env (default to Mainnet)
  const networkEnv = import.meta.env.VITE_SOLANA_CLUSTER as WalletAdapterNetwork | undefined;
  const network = networkEnv || WalletAdapterNetwork.Mainnet;
  
  // Support custom RPC endpoint (use env variable or fallback to default)
  const customRpcUrl = import.meta.env.VITE_SOLANA_RPC_URL;
  const endpoint = useMemo(() => {
    const rpcUrl = customRpcUrl || clusterApiUrl(network);
    // Create shared connection instance
    sharedConnection = new Connection(rpcUrl, 'confirmed');
    return rpcUrl;
  }, [network, customRpcUrl]);
  
  // Use explicit wallet adapters for better reliability
  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter({ network }),
  ], [network]);

  const onError = (error: any) => {
    console.error('[WalletContext] Adapter error:', error?.message || error);
    // Optional: Add toast notification here if needed
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
