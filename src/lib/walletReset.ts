/**
 * Aggressively clears all wallet-related cache from localStorage and sessionStorage
 * Use this to reset wallet adapter state when connection issues occur
 */
export const clearWalletStorage = async () => {
  try {
    const removeKey = (store: Storage, key: string) => {
      try { 
        store.removeItem(key); 
      } catch (e) {
        console.warn('Failed to remove key:', key, e);
      }
    };

    // Patterns to match wallet-related keys
    const patterns = [
      /^wallet/i,
      /^solana/i,
      /^phantom/i,
      /^solflare/i,
      /^adapter/i,
      /^backpack/i,
      /^ledger/i,
      /^slope/i,
      /^sollet/i,
    ];

    // Explicit keys known to cause issues
    const explicitKeys = [
      'walletAdapter',
      'walletName',
      'walletAdapterNetwork',
      'wallet-adapter-selected-wallet',
      'wallet-adapter-connected-wallet',
      'wallet-adapter-cache',
    ];

    const scrubStorage = (store: Storage) => {
      // Remove explicit keys
      explicitKeys.forEach(key => removeKey(store, key));

      // Scan and remove pattern-matched keys
      for (let i = store.length - 1; i >= 0; i--) {
        const key = store.key(i);
        if (key && patterns.some((pattern) => pattern.test(key))) {
          removeKey(store, key);
        }
      }
    };

    scrubStorage(localStorage);
    scrubStorage(sessionStorage);

    // Small delay to allow storage events to propagate
    await new Promise((resolve) => setTimeout(resolve, 120));
    
    console.info('[walletReset] Wallet storage cleared');
  } catch (error) {
    console.warn('[walletReset] Error clearing wallet storage:', error);
  }
};
