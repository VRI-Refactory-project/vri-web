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
  /** Present only for the viewer until the call server is connected. */
  stream?: MediaStream | null;
  cameraOff?: boolean;
  large?: boolean;
  /** Draws the purple outline used for the interpreter. */
  highlight?: boolean;
  /** The viewer's own tile is muted so they do not hear themselves. */
  muted?: boolean;
}

/** One person's video with their name on it. Without video it shows their initials. */
export function VideoTile({ name, stream, cameraOff, large, highlight, muted }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream ?? null;
  }, [stream]);
  const showVideo = Boolean(stream) && !cameraOff;
  return (
    <figure
      className={`vt${large ? ' vt--large' : ''}${highlight ? ' vt--highlight' : ''}`}
      aria-label={name}
    >
      {showVideo ? (
        <video ref={ref} className="vt__video" autoPlay playsInline muted={muted} />
      ) : (
        <span className="vt__initials" aria-hidden="true">
          {initials(name)}
        </span>
      )}
      <figcaption className="vt__name">{name}</figcaption>
    </figure>
  );
}
