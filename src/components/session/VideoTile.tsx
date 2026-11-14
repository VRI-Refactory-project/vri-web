import { useEffect, useRef } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { barsFor, type ConnectionQuality } from '../../features/session/videoQuality';
import { initials } from './initials';

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
  /** How good this person's connection is, shown as bars. Leave out to hide them. */
  quality?: ConnectionQuality;
  /** Makes this tile the big one (or puts it back). Leave out to hide the button. */
  onSpotlight?: () => void;
  /** True while this tile is the one the person picked to be the big one. */
  spotlighted?: boolean;
}

/** Three bars that fill up with the quality of someone's connection. */
function NetworkBars({ quality }: { quality: ConnectionQuality }) {
  const filled = barsFor(quality);
  return (
    <span
      className={`vt__bars vt__bars--${quality}`}
      role="img"
      aria-label={`Connection: ${quality}`}
    >
      {[1, 2, 3].map((bar) => (
        <i key={bar} className={bar <= filled ? 'is-on' : undefined} />
      ))}
    </span>
  );
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
  quality,
  onSpotlight,
  spotlighted,
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

      {quality && quality !== 'unknown' && <NetworkBars quality={quality} />}

      {onSpotlight && (
        <button
          type="button"
          className="vt__spot"
          onClick={onSpotlight}
          aria-label={spotlighted ? `Remove spotlight from ${name}` : `Spotlight ${name}`}
          aria-pressed={Boolean(spotlighted)}
        >
          {spotlighted ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      )}

      <figcaption className="vt__name">{name}</figcaption>
    </figure>
  );
}
