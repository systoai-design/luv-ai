import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  MonitorUp,
  X,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { useVideoCall } from '@/hooks/useVideoCall';
import { cn } from '@/lib/utils';

interface VideoCallProps {
  matchId: string;
  otherUserId: string;
  otherUserName: string;
  onClose: () => void;
}

export const VideoCall = ({ matchId, otherUserId, otherUserName, onClose }: VideoCallProps) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const {
    localStream,
    remoteStream,
    isVideoEnabled,
    isAudioEnabled,
    isSharingScreen,
    isConnecting,
    isConnected,
    toggleVideo,
    toggleAudio,
    toggleScreenShare,
    endCall,
  } = useVideoCall({
    matchId,
    otherUserId,
    onCallEnded: onClose,
  });

  // Set up local video stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Set up remote video stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const handleEndCall = () => {
    endCall();
    onClose();
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={cn(
      "fixed inset-0 z-50 bg-background",
      isFullscreen && "z-[100]"
    )}>
      <Card className="h-full rounded-none border-0 bg-gradient-to-br from-background via-background to-primary/5">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">{otherUserName}</h2>
              <p className="text-sm text-white/70">
                {isConnecting && "Connecting..."}
                {isConnected && "Connected"}
                {!isConnecting && !isConnected && "Waiting for connection..."}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFullscreen}
                className="text-white hover:bg-white/10"
              >
                {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleEndCall}
                className="text-white hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Video Streams */}
        <div className="relative h-full w-full">
          {/* Remote Video (Main) */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="h-full w-full object-cover"
          />
          
          {/* Remote Video Placeholder */}
          {!remoteStream && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
              <div className="text-center">
                <div className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl font-bold text-primary">
                    {otherUserName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <p className="text-muted-foreground">Waiting for {otherUserName}...</p>
              </div>
            </div>
          )}

          {/* Local Video (Picture-in-Picture) */}
          <div className="absolute bottom-20 right-4 w-48 h-36 rounded-lg overflow-hidden border-2 border-border/50 shadow-glow">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
            />
            {!isVideoEnabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                <VideoOff className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-6 bg-gradient-to-t from-black/60 to-transparent">
          <div className="flex justify-center gap-4">
            <Button
              variant={isVideoEnabled ? "secondary" : "destructive"}
              size="lg"
              onClick={toggleVideo}
              className="rounded-full h-14 w-14"
            >
              {isVideoEnabled ? (
                <Video className="h-5 w-5" />
              ) : (
                <VideoOff className="h-5 w-5" />
              )}
            </Button>

            <Button
              variant={isAudioEnabled ? "secondary" : "destructive"}
              size="lg"
              onClick={toggleAudio}
              className="rounded-full h-14 w-14"
            >
              {isAudioEnabled ? (
                <Mic className="h-5 w-5" />
              ) : (
                <MicOff className="h-5 w-5" />
              )}
            </Button>

            <Button
              variant={isSharingScreen ? "default" : "secondary"}
              size="lg"
              onClick={toggleScreenShare}
              className="rounded-full h-14 w-14"
            >
              <MonitorUp className="h-5 w-5" />
            </Button>

            <Button
              variant="destructive"
              size="lg"
              onClick={handleEndCall}
              className="rounded-full h-14 w-14 bg-red-500 hover:bg-red-600"
            >
              <Phone className="h-5 w-5 rotate-135" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
