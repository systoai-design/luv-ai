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
import { Loader2, ArrowLeft, Shield, DollarSign } from 'lucide-react';
import Header from '@/components/Header';

const CreatorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalEarnings = earnings.reduce((sum, e) => sum + Number(e.amount), 0);
  const pendingEarnings = earnings
    .filter(e => e.status === 'pending')
    .reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <h1 className="text-4xl font-bold mb-8">Creator Dashboard</h1>

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
    </div>
  );
};

export default CreatorDashboard;