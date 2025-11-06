import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, Heart, Sparkles, LogOut, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
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
  const { publicKey, connected, disconnect } = useWallet();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      if (connected) {
        await disconnect();
      }
      toast.success("Signed out successfully");
      navigate("/auth");
    } catch (error) {
      toast.error("Error signing out");
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <div className="relative">
            <Heart className="h-8 w-8 text-primary fill-primary animate-glow" />
            <Sparkles className="h-4 w-4 text-secondary absolute -top-1 -right-1" />
          </div>
          <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            LUVAI
          </span>
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
                      <span className="text-sm font-medium">{user.email}</span>
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
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button
              onClick={() => navigate("/auth")}
              className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-glow"
            >
              <Wallet className="h-4 w-4 mr-2" />
              Get Started
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
