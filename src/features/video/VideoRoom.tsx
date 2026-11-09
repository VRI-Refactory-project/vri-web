import { LiveKitRoom, VideoConference, RoomAudioRenderer } from '@livekit/components-react';
import '@livekit/components-styles';

interface VideoRoomProps {
  token: string;
  serverUrl?: string;
  video?: boolean;
  audio?: boolean;
  onLeave: () => void;
}

export function VideoRoom({
  token,
  serverUrl = import.meta.env.VITE_LIVEKIT_URL,
  video = true,
  audio = true,
  onLeave,
}: VideoRoomProps) {
  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        backgroundColor: '#111',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 
        CSS to fix the LiveKit default styles:
        1. Mirror the local video
        2. Hide the default 'Y' placeholder 
      */}
      <style>{`
        .lk-participant-tile[data-lk-local-participant="true"] video {
          transform: scaleX(-1);
        }
        
        .lk-participant-placeholder svg {
          display: none !important;
        }
        
        .lk-participant-placeholder {
          background-color: #382c77 !important;
        }
      `}</style>

      <LiveKitRoom
        video={video}
        audio={audio}
        token={token}
        serverUrl={serverUrl}
        data-lk-theme="default"
        style={{ height: '100%', flex: 1 }}
        onDisconnected={onLeave}
      >
        <VideoConference />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}
