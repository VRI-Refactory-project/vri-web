import { Captions, Ellipsis, LogOut, Mic, MicOff, PhoneOff, Video, VideoOff } from 'lucide-react';

interface Props {
  micOn: boolean;
  camOn: boolean;
  onToggleMic: () => void;
  onToggleCam: () => void;
  onEnd: () => void;
  /** Leave the call but keep the session going for the others. Everyone gets this button. */
  onLeave?: () => void;
  /** Only the person who started the session can end it for everyone; others only see Leave. */
  canEnd?: boolean;
  /** The lobby preview only has the mic and camera buttons. */
  lobby?: boolean;
}

/** The bar under the call: mute, video, leave, end call (starter only), and two later buttons. */
export function CallControls({
  micOn,
  camOn,
  onToggleMic,
  onToggleCam,
  onEnd,
  onLeave,
  canEnd = true,
  lobby,
}: Props) {
  return (
    <div className="cc" role="toolbar" aria-label="Call controls">
      <button type="button" className="cc__btn" onClick={onToggleMic} aria-pressed={!micOn}>
        <span className="cc__icon">{micOn ? <Mic size={18} /> : <MicOff size={18} />}</span>
        {micOn ? 'Mute' : 'Unmute'}
      </button>
      <button type="button" className="cc__btn" onClick={onToggleCam} aria-pressed={!camOn}>
        <span className="cc__icon">{camOn ? <Video size={18} /> : <VideoOff size={18} />}</span>
        {camOn ? 'Stop Video' : 'Start Video'}
      </button>
      {!lobby && (
        <>
          {onLeave && (
            <button type="button" className="cc__btn" onClick={onLeave}>
              <span className="cc__icon">
                <LogOut size={18} />
              </span>
              Leave Call
            </button>
          )}
          {canEnd && (
            <button type="button" className="cc__btn cc__btn--end" onClick={onEnd}>
              <span className="cc__icon">
                <PhoneOff size={20} />
              </span>
              End Call
            </button>
          )}
          <button type="button" className="cc__btn" disabled title="Coming soon">
            <span className="cc__icon">
              <Captions size={18} />
            </span>
            Live Captions
          </button>
          <button type="button" className="cc__btn" disabled title="Coming soon">
            <span className="cc__icon">
              <Ellipsis size={18} />
            </span>
            More
          </button>
        </>
      )}
    </div>
  );
}
