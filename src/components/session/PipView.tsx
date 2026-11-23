import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { LogOut, Mic, MicOff, Video, VideoOff } from 'lucide-react';

interface Props {
  /** The floating window to draw in. */
  pipWindow: Window;
  /** The big tile, as on the call screen. */
  children: ReactNode;
  micOn: boolean;
  camOn: boolean;
  canMic: boolean;
  canCam: boolean;
  onToggleMic: () => void;
  onToggleCam: () => void;
  onLeave: () => void;
}

/**
 * The call in the small floating window (Chrome, Edge): the big tile and the buttons someone needs
 * without going back to the tab. The browser's own "back to tab" button closes it.
 */
export function PipView({
  pipWindow,
  children,
  micOn,
  camOn,
  canMic,
  canCam,
  onToggleMic,
  onToggleCam,
  onLeave,
}: Props) {
  return createPortal(
    <main className="pip">
      <div className="pip__stage">{children}</div>
      <div className="pip__controls" role="toolbar" aria-label="Call controls">
        {canMic && (
          <button
            type="button"
            className={`pip__btn${micOn ? '' : ' pip__btn--off'}`}
            onClick={onToggleMic}
            aria-label={micOn ? 'Mute' : 'Unmute'}
          >
            {micOn ? <Mic size={18} /> : <MicOff size={18} />}
          </button>
        )}
        {canCam && (
          <button
            type="button"
            className={`pip__btn${camOn ? '' : ' pip__btn--off'}`}
            onClick={onToggleCam}
            aria-label={camOn ? 'Stop video' : 'Start video'}
          >
            {camOn ? <Video size={18} /> : <VideoOff size={18} />}
          </button>
        )}
        <button
          type="button"
          className="pip__btn pip__btn--leave"
          onClick={onLeave}
          aria-label="Leave call"
        >
          <LogOut size={18} />
        </button>
      </div>
    </main>,
    pipWindow.document.body,
  );
}
