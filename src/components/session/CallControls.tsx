import { Captions, Ellipsis, Mic, MicOff, PhoneOff, Video, VideoOff } from 'lucide-react';

interface Props {
  micOn: boolean;
  camOn: boolean;
  onToggleMic: () => void;
  onToggleCam: () => void;
  onEnd: () => void;
  /** The lobby preview only has the mic and camera buttons. */
  lobby?: boolean;
}

/** The bar under the call: mute, video, end call, and the two buttons that come with later stories. */
export function CallControls({ micOn, camOn, onToggleMic, onToggleCam, onEnd, lobby }: Props) {
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
          <button type="button" className="cc__btn cc__btn--end" onClick={onEnd}>
            <span className="cc__icon">
              <PhoneOff size={20} />
            </span>
            End Call
          </button>
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
