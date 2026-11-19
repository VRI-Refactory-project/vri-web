import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Maximize2, Minimize2, Pencil } from 'lucide-react';
import { MAX_NAME_LENGTH, type CallRole } from '../../features/session/callConnection';
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
  /** Shown under the name as a tag: Interpreter, or Hearing guest. */
  role?: CallRole;
  /** Lets the person change their own name. Only give it to their own tile. */
  onRename?: (name: string) => void;
}

const ROLE_LABEL: Record<CallRole, string> = {
  interpreter: 'Interpreter',
  guest: 'Hearing guest',
};

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
  role,
  onRename,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const saveName = (e: FormEvent) => {
    e.preventDefault();
    if (draft.trim()) onRename?.(draft);
    setEditing(false);
  };
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

      <figcaption className="vt__name">
        {editing ? (
          <form className="vt__rename" onSubmit={saveName}>
            <input
              autoFocus
              value={draft}
              maxLength={MAX_NAME_LENGTH}
              aria-label="Your name in this call"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && setEditing(false)}
            />
            <button type="submit" disabled={!draft.trim()}>
              Save
            </button>
          </form>
        ) : (
          <>
            <span className="vt__label">{name}</span>
            {onRename && (
              <button
                type="button"
                className="vt__edit"
                aria-label="Rename yourself"
                onClick={() => {
                  setDraft(name);
                  setEditing(true);
                }}
              >
                <Pencil size={12} />
              </button>
            )}
          </>
        )}
        {role && <span className="vt__tag">{ROLE_LABEL[role]}</span>}
      </figcaption>
    </figure>
  );
}
