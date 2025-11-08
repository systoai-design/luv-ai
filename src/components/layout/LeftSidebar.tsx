import { Home, Users, MessageCircle, ShoppingBag, Bell, User, Shield, LayoutDashboard, Package, Heart, Plus } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSidebarState } from "@/hooks/useSidebarState";
import { CreateCompanionDialog } from "@/components/creator/CreateCompanionDialog";

import { useUnreadCounts } from "@/hooks/useUnreadCounts";
import { Badge } from "@/components/ui/badge";

const LeftSidebar = () => {
  const { user } = useAuth();
  const { isCollapsed } = useSidebarState();
  const [profile, setProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [canCreateCompanion, setCanCreateCompanion] = useState(false);
  const { unreadMessages } = useUnreadCounts();

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data) {
          setProfile(data);
          setCanCreateCompanion(data.can_create_companion || false);
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

  const navItems = [
    { icon: Home, label: "Home", path: "/home" },
    { icon: Users, label: "Friends", path: "/friends" },
    { icon: Heart, label: "Connections", path: "/connections" },
    { icon: MessageCircle, label: "Messages", path: "/messages" },
    { icon: ShoppingBag, label: "Marketplace", path: "/marketplace" },
    { icon: Bell, label: "Notifications", path: "/notifications" },
  ];

  const NavItem = ({ item }: { item: typeof navItems[0] }) => {
    const showBadge = item.path === '/messages' && unreadMessages > 0;
    
    const content = (
      <NavLink
        to={item.path}
        className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted/50 transition-all duration-200 text-foreground group"
        activeClassName="bg-muted text-primary font-medium"
      >
        <item.icon className="h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
        {displayWidth && (
          <>
            <span className="animate-fade-in flex-1 transition-opacity duration-300">{item.label}</span>
            {showBadge && (
              <Badge variant="destructive" className="ml-auto animate-scale-in">
                {unreadMessages > 99 ? '99+' : unreadMessages}
              </Badge>
            )}
          </>
        )}
      </NavLink>
    );

    if (!displayWidth) {
      return (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>{content}</TooltipTrigger>
            <TooltipContent side="right">
              {item.label}
              {showBadge && ` (${unreadMessages})`}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return content;
  };

  const displayWidth = !isCollapsed;

  return (
    <aside 
      className={`hidden lg:flex flex-col border-r border-border/50 bg-card fixed left-0 top-16 bottom-0 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-y-auto z-40 ${
        displayWidth ? 'w-64 p-4' : 'w-16 p-2'
      }`}
      style={{ willChange: 'width' }}
    >

      {/* User Profile Section */}
      {profile && displayWidth && (
        <>
          <NavLink 
            to="/profile" 
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-all duration-200 mb-4 animate-fade-in group"
            activeClassName="bg-muted"
          >
            <Avatar className="h-10 w-10 transition-transform duration-200 group-hover:scale-105">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback className="bg-primary/20 text-primary">
                {profile.display_name?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 animate-fade-in">
              <p className="text-sm font-medium truncate">{profile.display_name || profile.username}</p>
              <p className="text-xs text-muted-foreground truncate">View Profile</p>
            </div>
          </NavLink>
          <Separator className="my-2" />
        </>
      )}

      {/* Collapsed Profile Icon */}
      {profile && !displayWidth && (
        <>
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <NavLink 
                  to="/profile" 
                  className="flex items-center justify-center p-2 rounded-lg hover:bg-muted/50 transition-all duration-200 mb-4 hover:scale-110"
                  activeClassName="bg-muted"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile.avatar_url} />
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {profile.display_name?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </NavLink>
              </TooltipTrigger>
              <TooltipContent side="right">View Profile</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Separator className="my-2" />
        </>
      )}

      {/* Main Navigation */}
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => (
          <NavItem key={item.path} item={item} />
        ))}
      </nav>

      {/* Create AI Companion Button */}
      {canCreateCompanion && (
        <>
          <Separator className="my-4" />
          <div className={`${displayWidth ? 'px-0' : 'px-0'}`}>
            {displayWidth ? (
              <CreateCompanionDialog />
            ) : (
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <CreateCompanionDialog />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">Create AI Companion</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </>
      )}

      <Separator className="my-4" />

      {/* Additional Links */}
      <nav className="flex flex-col gap-1">
        {!displayWidth ? (
          <>
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <NavLink
                    to="/purchases"
                    className="flex items-center justify-center px-3 py-3 rounded-lg hover:bg-muted/50 transition-colors text-foreground"
                    activeClassName="bg-muted text-primary font-medium"
                  >
                    <Package className="h-5 w-5" />
                  </NavLink>
                </TooltipTrigger>
                <TooltipContent side="right">My Purchases</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {canCreateCompanion && (
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <NavLink
                      to="/creator"
                      className="flex items-center justify-center px-3 py-3 rounded-lg hover:bg-muted/50 transition-colors text-foreground"
                      activeClassName="bg-muted text-primary font-medium"
                    >
                      <LayoutDashboard className="h-5 w-5" />
                    </NavLink>
                  </TooltipTrigger>
                  <TooltipContent side="right">Creator Dashboard</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {isAdmin && (
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <NavLink
                      to="/admin"
                      className="flex items-center justify-center px-3 py-3 rounded-lg hover:bg-muted/50 transition-colors text-foreground"
                      activeClassName="bg-muted text-primary font-medium"
                    >
                      <Shield className="h-5 w-5" />
                    </NavLink>
                  </TooltipTrigger>
                  <TooltipContent side="right">Admin Dashboard</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </>
        ) : (
          <>
            <NavLink
              to="/purchases"
              className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted/50 transition-all duration-200 text-foreground animate-fade-in group"
              activeClassName="bg-muted text-primary font-medium"
            >
              <Package className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
              <span className="transition-opacity duration-300">My Purchases</span>
            </NavLink>

            {canCreateCompanion && (
              <NavLink
                to="/creator"
                className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted/50 transition-all duration-200 text-foreground animate-fade-in group"
                activeClassName="bg-muted text-primary font-medium"
              >
                <LayoutDashboard className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
                <span className="transition-opacity duration-300">Creator Dashboard</span>
              </NavLink>
            )}

            {isAdmin && (
              <NavLink
                to="/admin"
                className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted/50 transition-all duration-200 text-foreground animate-fade-in group"
                activeClassName="bg-muted text-primary font-medium"
              >
                <Shield className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
                <span className="transition-opacity duration-300">Admin Dashboard</span>
              </NavLink>
            )}
          </>
        )}
      </nav>
    </aside>
  );
};

export default LeftSidebar;
