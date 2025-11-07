import { Home, Users, MessageCircle, ShoppingBag, Bell, User, Shield, LayoutDashboard, Package } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

const LeftSidebar = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [canCreateCompanion, setCanCreateCompanion] = useState(false);

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
    { icon: MessageCircle, label: "Messages", path: "/messages" },
    { icon: ShoppingBag, label: "Marketplace", path: "/marketplace" },
    { icon: Bell, label: "Notifications", path: "/notifications" },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-border/50 bg-card/30 p-4 fixed left-0 top-16 bottom-0 overflow-y-auto">
      {/* User Profile Section */}
      {profile && (
        <NavLink 
          to="/profile" 
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors mb-4"
          activeClassName="bg-muted"
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile.avatar_url} />
            <AvatarFallback className="bg-primary/20 text-primary">
              {profile.display_name?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{profile.display_name || profile.username}</p>
            <p className="text-xs text-muted-foreground truncate">View Profile</p>
          </div>
        </NavLink>
      )}

      <Separator className="my-2" />

      {/* Main Navigation */}
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted/50 transition-colors text-foreground"
            activeClassName="bg-muted text-primary font-medium"
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <Separator className="my-4" />

      {/* Additional Links */}
      <nav className="flex flex-col gap-1">
        <NavLink
          to="/purchases"
          className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted/50 transition-colors text-foreground"
          activeClassName="bg-muted text-primary font-medium"
        >
          <Package className="h-5 w-5" />
          <span>My Purchases</span>
        </NavLink>

        {canCreateCompanion && (
          <NavLink
            to="/creator"
            className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted/50 transition-colors text-foreground"
            activeClassName="bg-muted text-primary font-medium"
          >
            <LayoutDashboard className="h-5 w-5" />
            <span>Creator Dashboard</span>
          </NavLink>
        )}

        {isAdmin && (
          <NavLink
            to="/admin"
            className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted/50 transition-colors text-foreground"
            activeClassName="bg-muted text-primary font-medium"
          >
            <Shield className="h-5 w-5" />
            <span>Admin Dashboard</span>
          </NavLink>
        )}
      </nav>
    </aside>
  );
};

export default LeftSidebar;
