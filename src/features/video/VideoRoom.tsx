import { LiveKitRoom, VideoConference, RoomAudioRenderer } from '@livekit/components-react';
import '@livekit/components-styles';
import '../../pages/session/LiveSessionPage.css';

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
    <main className="ls ls--call">
      <LiveKitRoom
        video={video}
        audio={audio}
        token={token}
        serverUrl={serverUrl}
        data-lk-theme="default"
        style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
        onDisconnected={onLeave}
      >
        <div style={{ flex: 1, minHeight: 0 }}>
          <VideoConference />
        </div>
        <RoomAudioRenderer />
      </LiveKitRoom>
    </main>
  );
}
