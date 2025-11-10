import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2, X, Mic } from 'lucide-react';
import { MediaUpload } from './MediaUpload';
import { MediaPreview } from './MediaPreview';
import { VoiceRecorder } from './VoiceRecorder';
import { AudioPlayer } from './AudioPlayer';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ChatComposerProps {
  onSend: (payload: {
    text: string;
    mediaUrl?: string;
    mediaType?: 'image' | 'video' | 'audio';
    mediaThumbnail?: string;
    audioDuration?: number;
  }) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
  isLoading?: boolean;
}

export const ChatComposer = ({ 
  onSend, 
  disabled, 
  placeholder = "Type a message...",
  isLoading = false
}: ChatComposerProps) => {
  const [text, setText] = useState('');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'audio' | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | undefined>(undefined);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSend = async () => {
    if ((!text.trim() && !mediaUrl) || disabled || isLoading) return;
    
    await onSend({
      text: text.trim(),
      mediaUrl: mediaUrl || undefined,
      mediaType: mediaType || undefined,
      audioDuration: audioDuration,
    });

    setText('');
    setMediaUrl(null);
    setMediaType(null);
    setAudioDuration(undefined);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMediaSelected = (url: string, type: 'image' | 'video') => {
    setMediaUrl(url);
    setMediaType(type);
  };

  const handleVoiceRecordingComplete = async (audioBlob: Blob, duration: number) => {
    if (!user) return;

    try {
      const fileName = `voice_${Date.now()}_${user.id}.webm`;
      const filePath = `${user.id}/${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from('chat-media')
        .upload(filePath, audioBlob, {
          contentType: 'audio/webm',
          cacheControl: '3600',
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('chat-media')
        .getPublicUrl(data.path);

      setMediaUrl(urlData.publicUrl);
      setMediaType('audio');
      setAudioDuration(duration);
      setShowVoiceRecorder(false);

      toast({
        title: "Voice message ready",
        description: "Click send to deliver your message",
      });
    } catch (error) {
      console.error('Error uploading voice message:', error);
      toast({
        title: "Error",
        description: "Failed to upload voice message",
        variant: "destructive",
      });
    }
  };

  const clearMedia = () => {
    setMediaUrl(null);
    setMediaType(null);
    setAudioDuration(undefined);
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Media Preview */}
      {mediaUrl && mediaType && (
        <div className="relative p-2 border border-border rounded-lg bg-card/50">
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-1 right-1 h-6 w-6 z-10"
            onClick={clearMedia}
          >
            <X className="h-4 w-4" />
          </Button>
          {mediaType === 'audio' ? (
            <AudioPlayer audioUrl={mediaUrl} duration={audioDuration} />
          ) : (
            <MediaPreview mediaUrl={mediaUrl} mediaType={mediaType} />
          )}
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="min-h-[60px] max-h-[200px] resize-none bg-background/50 rounded-2xl border-2 focus-visible:ring-primary/50"
            disabled={disabled || isLoading}
          />
        </div>
        <Button 
          onClick={handleSend} 
          disabled={disabled || isLoading || (!text.trim() && !mediaUrl)} 
          size="icon"
          className="h-[60px] w-[60px] rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 shadow-lg transition-all hover:scale-105"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Media Upload Controls */}
      <div className="flex items-center gap-2">
        <MediaUpload onMediaSelected={handleMediaSelected} disabled={disabled || isLoading} />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowVoiceRecorder(true)}
          disabled={disabled || isLoading}
          className="shrink-0"
        >
          <Mic className="h-5 w-5" />
        </Button>
      </div>

      {/* Voice Recorder Modal */}
      <VoiceRecorder
        open={showVoiceRecorder}
        onOpenChange={setShowVoiceRecorder}
        onRecordingComplete={handleVoiceRecordingComplete}
      />
    </div>
  );
};
