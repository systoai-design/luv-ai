import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Users, Heart } from 'lucide-react';

interface ProfileStats {
  postsCount: number;
  followersCount: number;
  matchesCount: number;
}

interface MiniProfileCardProps {
  show: boolean;
}

export const MiniProfileCard = ({ show }: MiniProfileCardProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<ProfileStats>({
    postsCount: 0,
    followersCount: 0,
    matchesCount: 0,
  });

  useEffect(() => {
    if (!user || !show) return;

    const loadProfileAndStats = async () => {
      try {
        // Load profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('display_name, username, avatar_url')
          .eq('user_id', user.id)
          .single();

        if (profileData) {
          setProfile(profileData);
        }

        // Load stats
        const [postsRes, followersRes, matchesRes] = await Promise.all([
          supabase
            .from('posts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id),
          supabase
            .from('followers')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', user.id),
          supabase
            .from('matches')
            .select('*', { count: 'exact', head: true })
            .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`),
        ]);

        setStats({
          postsCount: postsRes.count || 0,
          followersCount: followersRes.count || 0,
          matchesCount: matchesRes.count || 0,
        });
      } catch (error) {
        console.error('Error loading mini profile:', error);
      }
    };

    loadProfileAndStats();
  }, [user, show]);

  if (!show || !profile) return null;

  return (
    <Card
      className="fixed bottom-4 left-20 w-60 shadow-xl z-[60] animate-fade-in animate-scale-in cursor-pointer hover:shadow-glow transition-shadow"
      onClick={() => navigate('/profile')}
    >
      <CardContent className="p-4 space-y-3">
        {/* Avatar & Name */}
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 border-2 border-primary/20">
            <AvatarImage src={profile.avatar_url || ''} />
            <AvatarFallback>
              {profile.display_name?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{profile.display_name}</p>
            <p className="text-xs text-muted-foreground truncate">
              @{profile.username || 'user'}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border/50" />

        {/* Quick Stats */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">Posts:</span>
            <span className="font-semibold ml-auto">{stats.postsCount}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">Followers:</span>
            <span className="font-semibold ml-auto">{stats.followersCount}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Heart className="h-4 w-4 text-primary fill-primary" />
            <span className="text-muted-foreground">Matches:</span>
            <span className="font-semibold ml-auto">{stats.matchesCount}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
