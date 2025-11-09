import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { clearWalletStorage } from "./lib/walletReset";

// Proactively clear wallet cache on app initialization to prevent stale connection state
(async () => {
  try {
    await clearWalletStorage();
    console.info('[main] Wallet cache cleared on app load');
  } catch (error) {
    console.warn('[main] Failed to clear wallet cache on load:', error);
  }
  
  createRoot(document.getElementById("root")!).render(<App />);
})();
