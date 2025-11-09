import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Plus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const CreateCompanionDialog = ({ onSuccess }: { onSuccess?: () => void }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    tagline: '',
    description: '',
    avatar_url: '',
    companion_type: 'ai',
    access_price: 0.0005,
    currency: 'SOL',
    system_prompt: '',
    voice_tone: 'friendly',
    // Personality traits (0-100)
    romance: 50,
    lust: 50,
    loyalty: 50,
    humor: 50,
    intelligence: 50,
    empathy: 50,
    playfulness: 50,
    dominance: 50,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('ai_companions')
        .insert({
          creator_id: user!.id,
          name: formData.name,
          tagline: formData.tagline,
          description: formData.description,
          avatar_url: formData.avatar_url || null,
          companion_type: formData.companion_type,
          access_price: formData.access_price,
          currency: formData.currency,
          system_prompt: formData.system_prompt || `You are ${formData.name}, ${formData.tagline}`,
          voice_tone: formData.voice_tone,
          romance: formData.romance,
          lust: formData.lust,
          loyalty: formData.loyalty,
          humor: formData.humor,
          intelligence: formData.intelligence,
          empathy: formData.empathy,
          playfulness: formData.playfulness,
          dominance: formData.dominance,
          is_active: true,
        });

      if (error) throw error;

      toast({
        title: 'Success!',
        description: 'Your AI companion has been created and is now live in the marketplace.',
      });

      setOpen(false);
      setFormData({
        name: '',
        tagline: '',
        description: '',
        avatar_url: '',
        companion_type: 'ai',
        access_price: 0.0005,
        currency: 'SOL',
        system_prompt: '',
        voice_tone: 'friendly',
        romance: 50,
        lust: 50,
        loyalty: 50,
        humor: 50,
        intelligence: 50,
        empathy: 50,
        playfulness: 50,
        dominance: 50,
      });

      onSuccess?.();
    } catch (error) {
      console.error('Error creating companion:', error);
      toast({
        title: 'Error',
        description: 'Failed to create companion. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-primary hover:opacity-90">
          <Plus className="h-4 w-4 mr-2" />
          Create AI Companion
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create AI Companion</DialogTitle>
          <DialogDescription>
            Create a new AI companion to list in the marketplace
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Luna"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tagline">Tagline *</Label>
            <Input
              id="tagline"
              required
              value={formData.tagline}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              placeholder="Your playful evening companion"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="A detailed description of your companion's personality..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatar_url">Avatar URL</Label>
            <Input
              id="avatar_url"
              type="url"
              value={formData.avatar_url}
              onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
              placeholder="https://example.com/avatar.jpg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="access_price">Price (SOL) *</Label>
              <Input
                id="access_price"
                type="number"
                step="0.0001"
                min="0"
                required
                value={formData.access_price}
                onChange={(e) => setFormData({ ...formData, access_price: parseFloat(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="voice_tone">Voice Tone</Label>
              <Select value={formData.voice_tone} onValueChange={(value) => setFormData({ ...formData, voice_tone: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="flirty">Flirty</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="playful">Playful</SelectItem>
                  <SelectItem value="seductive">Seductive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="system_prompt">System Prompt (Optional)</Label>
            <Textarea
              id="system_prompt"
              value={formData.system_prompt}
              onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
              placeholder="You are an AI companion who..."
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to auto-generate based on name and tagline
            </p>
          </div>

          <div className="space-y-4">
            <Label>Personality Traits</Label>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Romance</span>
                  <span className="text-sm text-muted-foreground">{formData.romance}</span>
                </div>
                <Slider
                  value={[formData.romance]}
                  onValueChange={([value]) => setFormData({ ...formData, romance: value })}
                  max={100}
                  step={1}
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Humor</span>
                  <span className="text-sm text-muted-foreground">{formData.humor}</span>
                </div>
                <Slider
                  value={[formData.humor]}
                  onValueChange={([value]) => setFormData({ ...formData, humor: value })}
                  max={100}
                  step={1}
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Intelligence</span>
                  <span className="text-sm text-muted-foreground">{formData.intelligence}</span>
                </div>
                <Slider
                  value={[formData.intelligence]}
                  onValueChange={([value]) => setFormData({ ...formData, intelligence: value })}
                  max={100}
                  step={1}
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Empathy</span>
                  <span className="text-sm text-muted-foreground">{formData.empathy}</span>
                </div>
                <Slider
                  value={[formData.empathy]}
                  onValueChange={([value]) => setFormData({ ...formData, empathy: value })}
                  max={100}
                  step={1}
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Playfulness</span>
                  <span className="text-sm text-muted-foreground">{formData.playfulness}</span>
                </div>
                <Slider
                  value={[formData.playfulness]}
                  onValueChange={([value]) => setFormData({ ...formData, playfulness: value })}
                  max={100}
                  step={1}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Companion'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
