import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { AudioPlayer } from './AudioPlayer';

interface MediaPreviewProps {
  mediaUrl: string;
  mediaType: 'image' | 'video' | 'audio';
  thumbnail?: string;
  audioDuration?: number;
}

export const MediaPreview = ({ mediaUrl, mediaType, thumbnail, audioDuration }: MediaPreviewProps) => {
  const [showLightbox, setShowLightbox] = useState(false);

  if (mediaType === 'audio') {
    return <AudioPlayer audioUrl={mediaUrl} duration={audioDuration} />;
  }

  if (mediaType === 'image') {
    return (
      <>
        <img
          src={mediaUrl}
          alt="Shared media"
          className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => setShowLightbox(true)}
        />
        <Dialog open={showLightbox} onOpenChange={setShowLightbox}>
          <DialogContent className="max-w-4xl">
            <img src={mediaUrl} alt="Shared media" className="w-full h-auto" />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <video
      src={mediaUrl}
      poster={thumbnail}
      controls
      className="max-w-full rounded-lg"
    />
  );
};
