import { Button } from "@/components/ui/button";
import { LogOut, User, ShoppingBag, LayoutDashboard, Shield, Home } from "lucide-react";
import logo from "@/assets/logo.svg";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useNavigate } from "react-router-dom";
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

const AppHeader = () => {
  const { user } = useAuth();
  const { publicKey, connected } = useWallet();
  const navigate = useNavigate();
  const { handleDisconnect } = useWalletAuth();
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
  const [displayName, setDisplayName] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [canCreateCompanion, setCanCreateCompanion] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, username, can_create_companion')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profile) {
          setDisplayName(profile.display_name || profile.username || 'User');
          setCanCreateCompanion(profile.can_create_companion || false);
        }

        // Check if user is admin
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        setIsAdmin(!!roles);
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };

    loadProfile();
  }, [user]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <button onClick={() => navigate("/home")} className="flex items-center hover:opacity-80 transition-opacity">
          <img src={logo} alt="LUVAI" className="h-12 w-auto" />
        </button>
        
        <div className="flex items-center gap-3">
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
              <DropdownMenuItem onClick={() => navigate("/home")}>
                <Home className="mr-2 h-4 w-4" />
                Home Feed
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/purchases")}>
                <ShoppingBag className="mr-2 h-4 w-4" />
                My Purchases
              </DropdownMenuItem>
              {canCreateCompanion && (
                <DropdownMenuItem onClick={() => navigate("/creator")}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Creator Dashboard
                </DropdownMenuItem>
              )}
              {isAdmin && (
                <DropdownMenuItem onClick={() => navigate("/admin")}>
                  <Shield className="mr-2 h-4 w-4" />
                  Admin Dashboard
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setDisconnectDialogOpen(true)} 
                className="text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Disconnect Wallet
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
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

export default AppHeader;
