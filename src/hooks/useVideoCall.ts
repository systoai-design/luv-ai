import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface UseVideoCallProps {
  matchId: string;
  otherUserId: string;
  onCallEnded?: () => void;
}

interface SignalMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'end-call';
  data: any;
  senderId: string;
  receiverId: string;
  matchId: string;
}

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export const useVideoCall = ({ matchId, otherUserId, onCallEnded }: UseVideoCallProps) => {
  const { user } = useAuth();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<any>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // Initialize local media stream
  const initializeMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      toast.error('Failed to access camera/microphone');
      return null;
    }
  }, []);

  // Create peer connection
  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
        const message: SignalMessage = {
          type: 'ice-candidate',
          data: event.candidate,
          senderId: user!.id,
          receiverId: otherUserId,
          matchId,
        };
        channelRef.current.send({
          type: 'broadcast',
          event: 'webrtc-signal',
          payload: message,
        });
      }
    };

    pc.ontrack = (event) => {
      console.log('Received remote track:', event.streams[0]);
      setRemoteStream(event.streams[0]);
      setIsConnected(true);
      setIsConnecting(false);
    };

    pc.onconnectionstatechange = () => {
      console.log('Connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setIsConnected(true);
        setIsConnecting(false);
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setIsConnected(false);
        toast.error('Connection lost');
      }
    };

    return pc;
  }, [user, otherUserId, matchId]);

  // Initialize WebRTC connection
  useEffect(() => {
    if (!user) return;

    const init = async () => {
      // Initialize media
      const stream = await initializeMedia();
      if (!stream) return;

      // Create peer connection
      const pc = createPeerConnection();
      peerConnectionRef.current = pc;

      // Add local tracks to peer connection
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Set up Supabase realtime channel for signaling
      const channel = supabase.channel(`video-call-${matchId}`);
      channelRef.current = channel;

      channel
        .on('broadcast', { event: 'webrtc-signal' }, async ({ payload }: { payload: SignalMessage }) => {
          if (payload.receiverId !== user.id) return;

          console.log('Received signal:', payload.type);

          try {
            switch (payload.type) {
              case 'offer':
                await pc.setRemoteDescription(new RTCSessionDescription(payload.data));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                
                const answerMessage: SignalMessage = {
                  type: 'answer',
                  data: answer,
                  senderId: user.id,
                  receiverId: otherUserId,
                  matchId,
                };
                channel.send({
                  type: 'broadcast',
                  event: 'webrtc-signal',
                  payload: answerMessage,
                });
                break;

              case 'answer':
                await pc.setRemoteDescription(new RTCSessionDescription(payload.data));
                break;

              case 'ice-candidate':
                await pc.addIceCandidate(new RTCIceCandidate(payload.data));
                break;

              case 'end-call':
                onCallEnded?.();
                break;
            }
          } catch (error) {
            console.error('Error handling signal:', error);
          }
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            // Create and send offer
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            const offerMessage: SignalMessage = {
              type: 'offer',
              data: offer,
              senderId: user.id,
              receiverId: otherUserId,
              matchId,
            };
            channel.send({
              type: 'broadcast',
              event: 'webrtc-signal',
              payload: offerMessage,
            });
          }
        });
    };

    init();

    // Cleanup
    return () => {
      localStream?.getTracks().forEach((track) => track.stop());
      screenStreamRef.current?.getTracks().forEach((track) => track.stop());
      peerConnectionRef.current?.close();
      channelRef.current?.unsubscribe();
    };
  }, [user, matchId, otherUserId, createPeerConnection, initializeMedia, onCallEnded]);

  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  }, [localStream]);

  const toggleAudio = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  }, [localStream]);

  const toggleScreenShare = useCallback(async () => {
    if (!peerConnectionRef.current) return;

    try {
      if (isSharingScreen) {
        // Stop screen sharing, restore camera
        screenStreamRef.current?.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;

        if (localStream) {
          const videoTrack = localStream.getVideoTracks()[0];
          const sender = peerConnectionRef.current
            .getSenders()
            .find((s) => s.track?.kind === 'video');
          
          if (sender && videoTrack) {
            await sender.replaceTrack(videoTrack);
          }
        }
        setIsSharingScreen(false);
        toast.success('Screen sharing stopped');
      } else {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
        
        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];

        const sender = peerConnectionRef.current
          .getSenders()
          .find((s) => s.track?.kind === 'video');

        if (sender) {
          await sender.replaceTrack(screenTrack);
        }

        screenTrack.onended = () => {
          toggleScreenShare(); // Auto-stop when user stops sharing
        };

        setIsSharingScreen(true);
        toast.success('Screen sharing started');
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
      toast.error('Failed to toggle screen sharing');
    }
  }, [isSharingScreen, localStream]);

  const endCall = useCallback(() => {
    if (channelRef.current) {
      const message: SignalMessage = {
        type: 'end-call',
        data: null,
        senderId: user!.id,
        receiverId: otherUserId,
        matchId,
      };
      channelRef.current.send({
        type: 'broadcast',
        event: 'webrtc-signal',
        payload: message,
      });
    }

    localStream?.getTracks().forEach((track) => track.stop());
    screenStreamRef.current?.getTracks().forEach((track) => track.stop());
    peerConnectionRef.current?.close();
    channelRef.current?.unsubscribe();

    onCallEnded?.();
  }, [user, otherUserId, matchId, localStream, onCallEnded]);

  return {
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
  };
};
