import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingVerifications, setPendingVerifications] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    checkAdminStatus();
  }, [user, navigate]);

  const checkAdminStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user!.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast({
          title: 'Access denied',
          description: 'You do not have admin privileges',
          variant: 'destructive',
        });
        navigate('/');
        return;
      }

      setIsAdmin(true);
      loadPendingVerifications();
    } catch (error) {
      console.error('Error checking admin status:', error);
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPendingVerifications = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('verification_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingVerifications(data || []);
    } catch (error) {
      console.error('Error loading verifications:', error);
    }
  };

  const handleVerificationAction = async (profileId: string, action: 'approve' | 'reject') => {
    try {
      const updates =
        action === 'approve'
          ? {
              verification_status: 'approved',
              is_verified: true,
              can_create_companion: true,
            }
          : {
              verification_status: 'rejected',
              is_verified: false,
              can_create_companion: false,
            };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profileId);

      if (error) throw error;

      toast({
        title: action === 'approve' ? 'Verification approved' : 'Verification rejected',
        description: `User has been ${action === 'approve' ? 'verified' : 'rejected'}`,
      });

      loadPendingVerifications();
    } catch (error) {
      console.error('Error updating verification:', error);
      toast({
        title: 'Error',
        description: 'Failed to update verification status',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>

      <Card>
          <CardHeader>
            <CardTitle>Pending Verifications</CardTitle>
            <CardDescription>Review and approve creator verification requests</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingVerifications.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No pending verification requests
              </p>
            ) : (
              <div className="space-y-4">
                {pendingVerifications.map((profile) => (
                  <Card key={profile.id}>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold text-lg">{profile.display_name}</h3>
                          <p className="text-sm text-muted-foreground">@{profile.username}</p>
                        </div>

                        {profile.bio && (
                          <div>
                            <p className="text-sm font-medium mb-1">Bio:</p>
                            <p className="text-sm text-muted-foreground">{profile.bio}</p>
                          </div>
                        )}

                        {profile.social_links && Object.keys(profile.social_links).length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-2">Social Links:</p>
                            <div className="space-y-1">
                              {Object.entries(profile.social_links).map(([platform, url]) => (
                                <a
                                  key={platform}
                                  href={url as string}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-primary hover:underline block"
                                >
                                  {platform}: {url as string}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleVerificationAction(profile.id, 'approve')}
                            className="flex-1"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleVerificationAction(profile.id, 'reject')}
                            variant="destructive"
                            className="flex-1"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
};

export default AdminDashboard;