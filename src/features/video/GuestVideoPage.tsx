import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { GuestJoin } from './GuestJoin';
import { PreSessionLobby } from './PreSessionLobby';
import { VideoRoom } from './VideoRoom';

export function GuestVideoPage() {
  const { roomName = '' } = useParams();
  const [participantName, setParticipantName] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchToken = async (name: string) => {
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_TOKEN_API_URL}/api/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName, participantName: name }),
      });
      const data = await res.json();
      if (!res.ok || !data.token) {
        setError(data.error || 'Could not get a token for this room.');
        setParticipantName(null);
        return;
      }
      setToken(data.token);
    } catch {
      setError('Could not reach the video server. Please try again.');
      setParticipantName(null);
    }
  };

  if (token) {
    return <VideoRoom token={token} onLeave={() => setToken(null)} />;
  }

  if (participantName) {
    return (
      <PreSessionLobby
        onJoin={() => fetchToken(participantName)}
        onCancel={() => setParticipantName(null)}
      />
    );
  }

  return (
    <GuestJoin
      roomName={roomName}
      error={error}
      onJoin={(name) => setParticipantName(name)}
    />
  );
}
