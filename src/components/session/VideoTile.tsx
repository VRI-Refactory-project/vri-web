import { useEffect, useRef } from 'react';

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

interface Props {
  name: string;
  stream?: MediaStream | null;
  cameraOff?: boolean;
  large?: boolean;
  highlight?: boolean;
  muted?: boolean;
  profilePicture?: string | null; // NEW: Allow a profile picture URL
  /** A shared screen: shown whole and not mirrored like a camera. */
  screen?: boolean;
}

export function VideoTile({
  name,
  stream,
  cameraOff,
  large,
  highlight,
  muted,
  profilePicture,
  screen,
}: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream ?? null;
  }, [stream]);
  const showVideo = Boolean(stream) && !cameraOff;

  return (
    <figure
      className={`vt${large ? ' vt--large' : ''}${highlight ? ' vt--highlight' : ''}${screen ? ' vt--screen' : ''}`}
      aria-label={name}
    >
      <video
        ref={ref}
        className="vt__video"
        autoPlay
        playsInline
        muted={muted}
        hidden={!showVideo}
      />

      {/* FIXED: Show profile picture if available, otherwise show initials */}
      {!showVideo &&
        (profilePicture ? (
          <img
            src={profilePicture}
            alt={name}
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              objectFit: 'cover',
              zIndex: 1,
            }}
          />
        ) : (
          <span className="vt__initials" aria-hidden="true">
            {initials(name)}
          </span>
        ))}

      <figcaption className="vt__name">{name}</figcaption>
    </figure>
  );
}
