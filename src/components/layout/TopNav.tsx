import { Button } from "@/components/ui/button";
import { Bell, MessageCircle, User, Menu, Wallet } from "lucide-react";
import logo from "@/assets/logo.svg";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import SearchBar from "./SearchBar";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";
import { useSidebarState } from "@/hooks/useSidebarState";
import { useUserPresence } from "@/hooks/useUserPresence";
import { AuthModal } from "@/components/AuthModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { DisconnectDialog } from "@/components/DisconnectDialog";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { useWallet } from "@solana/wallet-adapter-react";
import { LogOut, ShoppingBag, LayoutDashboard, Shield, Home as HomeIcon, ArrowLeft } from "lucide-react";

const TopNav = () => {
  useUserPresence(); // Initialize presence tracking
  const { user } = useAuth();
  const { publicKey } = useWallet();
  const navigate = useNavigate();
  const { handleDisconnect } = useWalletAuth();
  const { toggleMobile } = useSidebarState();
  const { unreadNotifications, unreadMessages } = useUnreadCounts();
  const [displayName, setDisplayName] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [canCreateCompanion, setCanCreateCompanion] = useState(false);
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

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
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-card/95 backdrop-blur-lg">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Left: Logo + Menu (Mobile) */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={toggleMobile}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <button onClick={() => navigate("/home")} className="flex items-center">
              <img src={logo} alt="LUVAI" className="h-10 w-auto" />
            </button>
          </div>

          {/* Center: Search Bar */}
          <div className="hidden md:flex flex-1 max-w-xl mx-4">
            <SearchBar />
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Home Icon (Mobile) */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => navigate("/home")}
            >
              <HomeIcon className="h-5 w-5" />
            </Button>

            {/* Messages */}
            <Button
              variant="ghost"
              size="icon"
              className="relative hidden sm:flex"
              onClick={() => navigate("/messages")}
            >
              <MessageCircle className="h-5 w-5" />
              {unreadMessages > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-verified text-xs">
                  {unreadMessages}
                </Badge>
              )}
            </Button>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className="relative hidden sm:flex"
              onClick={() => navigate("/notifications")}
            >
              <Bell className="h-5 w-5" />
              {unreadNotifications > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-verified text-xs">
                  {unreadNotifications}
                </Badge>
              )}
            </Button>

            {/* Wallet */}
            {!publicKey ? (
              <Button 
                onClick={() => setAuthModalOpen(true)} 
                variant="outline" 
                size="sm"
                className="gap-2 hidden sm:flex"
              >
                <Wallet className="h-4 w-4" />
                Connect
              </Button>
            ) : (
              <Button variant="outline" size="sm" className="gap-2 font-mono text-xs hidden sm:flex">
                <Wallet className="h-4 w-4" />
                {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
              </Button>
            )}

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{displayName || 'User'}</span>
                    {publicKey && (
                      <span className="text-xs text-muted-foreground font-mono">
                        {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
                      </span>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/")}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Landing
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/home")}>
                  <HomeIcon className="mr-2 h-4 w-4" />
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

        {/* Mobile Search Bar */}
        <div className="md:hidden px-4 pb-3 pt-1">
          <SearchBar />
        </div>
      </header>

      <AuthModal 
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        onSuccess={() => navigate("/home")}
      />
      
      <DisconnectDialog
        open={disconnectDialogOpen}
        onOpenChange={setDisconnectDialogOpen}
        onConfirm={() => {
          setDisconnectDialogOpen(false);
          handleDisconnect();
        }}
        walletAddress={publicKey?.toBase58()}
      />
    </>
  );
};

export default TopNav;
