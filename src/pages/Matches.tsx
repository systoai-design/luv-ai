import { useMatches } from '@/hooks/useMatches';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Heart, Loader2, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const Matches = () => {
  const { matches, loading } = useMatches();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary fill-primary" />
            Your Matches ({matches.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {matches.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No Matches Yet</h3>
              <p className="text-muted-foreground mb-4">
                Start swiping to find your matches!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matches.map((match) => {
                const unreadCount = match.user_id_1 === match.profile.id 
                  ? match.unread_count_2 
                  : match.unread_count_1;

                return (
                  <Card
                    key={match.id}
                    className="bg-background/50 border-border hover:border-primary/50 transition-all cursor-pointer group"
                    onClick={() => navigate('/messages')}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="w-16 h-16">
                          <AvatarImage
                            src={match.profile.avatar_url || ''}
                            alt={match.profile.display_name || 'User'}
                          />
                          <AvatarFallback>
                            {match.profile.display_name?.[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold truncate">
                              {match.profile.display_name || 'Anonymous'}
                            </h3>
                            {unreadCount > 0 && (
                              <Badge variant="default" className="text-xs">
                                {unreadCount}
                              </Badge>
                            )}
                          </div>

                          {match.profile.bio && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {match.profile.bio}
                            </p>
                          )}

                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Heart className="h-3 w-3 fill-primary text-primary" />
                            <span>
                              Matched {formatDistanceToNow(new Date(match.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>

                        <MessageCircle className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Matches;
