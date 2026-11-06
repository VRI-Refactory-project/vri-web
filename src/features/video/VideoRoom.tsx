import { LiveKitRoom, VideoConference, RoomAudioRenderer } from '@livekit/components-react';
import '@livekit/components-styles';

interface VideoRoomProps {
  token: string;
  serverUrl?: string;
  /** Turn the camera on when joining. Hearing guests may join without video. */
  video?: boolean;
  /** Turn the microphone on when joining. False means the person only listens. */
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
