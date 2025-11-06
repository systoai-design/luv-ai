import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, Heart, Sparkles, LogOut, User } from "lucide-react";
import logo from "@/assets/logo.svg";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useNavigate } from "react-router-dom";
import { AuthModal } from "@/components/AuthModal";
import { DisconnectDialog } from "@/components/DisconnectDialog";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const { user } = useAuth();
  const { publicKey, connected } = useWallet();
  const navigate = useNavigate();
  const { handleDisconnect } = useWalletAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
  const [displayName, setDisplayName] = useState<string>("");

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('display_name, username')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data) {
          setDisplayName(data.display_name || data.username || 'User');
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };

    loadProfile();
  }, [user]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <a href="/" className="flex items-center">
          <img src={logo} alt="LUVAI" className="h-12 w-auto" />
        </a>
        
        <nav className="hidden md:flex items-center gap-6">
          <a href="#discover" className="text-foreground/80 hover:text-foreground transition-colors">
            Discover
          </a>
          <a href="#marketplace" className="text-foreground/80 hover:text-foreground transition-colors">
            Marketplace
          </a>
          <a href="#how-it-works" className="text-foreground/80 hover:text-foreground transition-colors">
            How It Works
          </a>
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Phantom Wallet Button */}
              <div className="wallet-adapter-button-container">
                <WalletMultiButton />
              </div>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-full">
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{displayName || 'User'}</span>
                      {connected && publicKey && (
                        <span className="text-xs text-muted-foreground font-mono">
                          {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
                        </span>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setDisconnectDialogOpen(true)} 
                    className="text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Disconnect Wallet
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button
              onClick={() => setAuthModalOpen(true)}
              className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-glow"
            >
              <Wallet className="h-4 w-4 mr-2" />
              Get Started
            </Button>
          )}
        </div>
      </div>
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
      <DisconnectDialog
        open={disconnectDialogOpen}
        onOpenChange={setDisconnectDialogOpen}
        onConfirm={() => {
          setDisconnectDialogOpen(false);
          handleDisconnect();
        }}
        walletAddress={publicKey?.toBase58()}
      />
    </header>
  );
};

export default Header;
