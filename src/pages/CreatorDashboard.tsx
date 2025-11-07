import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, DollarSign } from 'lucide-react';
import { CreateCompanionDialog } from '@/components/creator/CreateCompanionDialog';

const CreatorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [companions, setCompanions] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationForm, setVerificationForm] = useState({
    socialLinks: { twitter: '', instagram: '', website: '' },
    bio: '',
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadProfile();
    loadEarnings();
    loadCompanions();
  }, [user, navigate]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCompanions = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_companions')
        .select('*')
        .eq('creator_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCompanions(data || []);
    } catch (error) {
      console.error('Error loading companions:', error);
    }
  };

  const loadEarnings = async () => {
    try {
      const { data, error } = await supabase
        .from('creator_earnings')
        .select('*, ai_companions(name)')
        .eq('creator_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEarnings(data || []);
    } catch (error) {
      console.error('Error loading earnings:', error);
    }
  };

  const handleApplyForVerification = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          verification_status: 'pending',
          verification_type: 'creator',
          social_links: verificationForm.socialLinks,
          bio: verificationForm.bio,
        })
        .eq('user_id', user!.id);

      if (error) throw error;

      toast({
        title: 'Application submitted',
        description: 'Your verification application has been submitted for review',
      });
      loadProfile();
    } catch (error) {
      console.error('Error applying for verification:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit application',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalEarnings = earnings.reduce((sum, e) => sum + Number(e.amount), 0);
  const pendingEarnings = earnings
    .filter(e => e.status === 'pending')
    .reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold">Creator Dashboard</h1>
        {profile?.can_create_companion && (
          <CreateCompanionDialog onSuccess={loadCompanions} />
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalEarnings.toFixed(2)} SOL</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{pendingEarnings.toFixed(2)} SOL</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {profile?.is_verified ? (
                  <>
                    <Shield className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Verified</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">
                    {profile?.verification_status === 'pending' ? 'Pending Review' : 'Not Verified'}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {!profile?.is_verified && profile?.verification_status !== 'pending' && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Apply for Verification</CardTitle>
              <CardDescription>
                Get verified to create your own human companion profile and set your own pricing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={verificationForm.bio}
                  onChange={(e) => setVerificationForm({ ...verificationForm, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="twitter">Twitter</Label>
                <Input
                  id="twitter"
                  value={verificationForm.socialLinks.twitter}
                  onChange={(e) =>
                    setVerificationForm({
                      ...verificationForm,
                      socialLinks: { ...verificationForm.socialLinks, twitter: e.target.value },
                    })
                  }
                  placeholder="https://twitter.com/username"
                />
              </div>

              <div>
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  value={verificationForm.socialLinks.instagram}
                  onChange={(e) =>
                    setVerificationForm({
                      ...verificationForm,
                      socialLinks: { ...verificationForm.socialLinks, instagram: e.target.value },
                    })
                  }
                  placeholder="https://instagram.com/username"
                />
              </div>

              <Button onClick={handleApplyForVerification} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Application'
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {profile?.verification_status === 'pending' && (
          <Card className="mb-8 border-primary">
            <CardHeader>
              <CardTitle>Verification Pending</CardTitle>
              <CardDescription>
                Your verification application is under review. We'll notify you once it's processed.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {profile?.can_create_companion && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>My AI Companions</CardTitle>
              <CardDescription>Companions you've created and listed in the marketplace</CardDescription>
            </CardHeader>
            <CardContent>
              {companions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">You haven't created any companions yet</p>
                  <CreateCompanionDialog onSuccess={loadCompanions} />
                </div>
              ) : (
                <div className="space-y-4">
                  {companions.map((companion) => (
                    <div
                      key={companion.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-gradient-primary flex items-center justify-center text-lg font-bold">
                          {companion.name[0]}
                        </div>
                        <div>
                          <p className="font-medium">{companion.name}</p>
                          <p className="text-sm text-muted-foreground">{companion.tagline}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{companion.access_price} {companion.currency}</p>
                        <p className="text-sm text-muted-foreground">
                          {companion.is_active ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Earnings History</CardTitle>
            <CardDescription>Your earnings from companion access purchases</CardDescription>
          </CardHeader>
          <CardContent>
            {earnings.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No earnings yet</p>
            ) : (
              <div className="space-y-4">
                {earnings.map((earning) => (
                  <div
                    key={earning.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{earning.ai_companions?.name || 'Unknown'}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(earning.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{Number(earning.amount).toFixed(2)} SOL</p>
                      <p className="text-sm text-muted-foreground capitalize">{earning.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
};

export default CreatorDashboard;