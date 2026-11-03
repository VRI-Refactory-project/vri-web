import { LiveKitRoom, VideoConference, RoomAudioRenderer } from '@livekit/components-react';
import '@livekit/components-styles';

interface VideoRoomProps {
  token: string;
  serverUrl?: string;
  onLeave: () => void;
}

export function VideoRoom({
  token,
  serverUrl = import.meta.env.VITE_LIVEKIT_URL,
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
      <LiveKitRoom
        video={true}
        audio={true}
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
