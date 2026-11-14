import { useState } from 'react';
import {
  Captions,
  ChevronUp,
  Ellipsis,
  LogOut,
  MessageSquare,
  Mic,
  MicOff,
  MonitorUp,
  PhoneOff,
  Signal,
  Video,
  VideoOff,
} from 'lucide-react';
import type { MediaDevice } from '../../features/session/useLocalMedia';
import {
  QUALITY_ORDER,
  QUALITY_PRESETS,
  type VideoQualityChoice,
} from '../../features/session/videoQuality';

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
  /** False for "Listen only": no Mute button at all. */
  canMic?: boolean;
  /** False for "Audio only" and "Listen only": no Video button at all. */
  canCam?: boolean;
  /** The microphones and cameras to pick from, and which one is in use. */
  mics?: MediaDevice[];
  cams?: MediaDevice[];
  selectedMic?: string | null;
  selectedCam?: string | null;
  onPickDevice?: (kind: 'audio' | 'video', deviceId: string) => void;
  /** Share screen. Leave out to hide the button. */
  onShareScreen?: () => void;
  sharing?: boolean;
  /** Video quality. Leave out to hide the button. */
  quality?: VideoQualityChoice;
  onPickQuality?: (choice: VideoQualityChoice) => void;
  /** Chat. Leave out to hide the button. */
  onToggleChat?: () => void;
  chatOpen?: boolean;
  unread?: number;
}

interface DeviceMenuProps {
  label: string;
  devices: MediaDevice[];
  selected?: string | null;
  onPick: (deviceId: string) => void;
}

/** The small arrow beside Mute / Video that lists the devices to pick from. */
function DeviceMenu({ label, devices, selected, onPick }: DeviceMenuProps) {
  const [open, setOpen] = useState(false);
  if (devices.length === 0) return null;
  return (
    <div className="cc__menu-wrap">
      <button
        type="button"
        className="cc__chevron"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <ChevronUp size={14} />
      </button>
      {open && (
        <ul className="cc__menu" role="menu" aria-label={label}>
          {devices.map((device) => (
            <li key={device.id} role="none">
              <button
                type="button"
                role="menuitemradio"
                aria-checked={device.id === selected}
                className={device.id === selected ? 'is-selected' : undefined}
                onClick={() => {
                  onPick(device.id);
                  setOpen(false);
                }}
              >
                {device.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** "Quality": a button that opens the list of video qualities to choose from. */
function QualityMenu({
  quality,
  onPick,
}: {
  quality: VideoQualityChoice;
  onPick: (choice: VideoQualityChoice) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="cc__menu-wrap">
      <button
        type="button"
        className="cc__btn"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="cc__icon">
          <Signal size={18} />
        </span>
        Quality
      </button>
      {open && (
        <ul className="cc__menu" role="menu" aria-label="Video quality">
          {QUALITY_ORDER.map((choice) => (
            <li key={choice} role="none">
              <button
                type="button"
                role="menuitemradio"
                aria-checked={choice === quality}
                className={choice === quality ? 'is-selected' : undefined}
                onClick={() => {
                  onPick(choice);
                  setOpen(false);
                }}
              >
                {QUALITY_PRESETS[choice].label}
                <small className="cc__hint">{QUALITY_PRESETS[choice].hint}</small>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** The bar under the call: mute, video, share, chat, leave, end call (starter only), and two later buttons. */
export function CallControls({
  micOn,
  camOn,
  onToggleMic,
  onToggleCam,
  onEnd,
  onLeave,
  canEnd = true,
  lobby,
  canMic = true,
  canCam = true,
  mics = [],
  cams = [],
  selectedMic,
  selectedCam,
  onPickDevice,
  onShareScreen,
  sharing,
  quality = 'auto',
  onPickQuality,
  onToggleChat,
  chatOpen,
  unread = 0,
}: Props) {
  return (
    <div className="cc" role="toolbar" aria-label="Call controls">
      {canMic && (
        <div className="cc__group">
          <button type="button" className="cc__btn" onClick={onToggleMic} aria-pressed={!micOn}>
            <span className="cc__icon">{micOn ? <Mic size={18} /> : <MicOff size={18} />}</span>
            {micOn ? 'Mute' : 'Unmute'}
          </button>
          {onPickDevice && (
            <DeviceMenu
              label="Choose microphone"
              devices={mics}
              selected={selectedMic}
              onPick={(id) => onPickDevice('audio', id)}
            />
          )}
        </div>
      )}
      {canCam && (
        <div className="cc__group">
          <button type="button" className="cc__btn" onClick={onToggleCam} aria-pressed={!camOn}>
            <span className="cc__icon">{camOn ? <Video size={18} /> : <VideoOff size={18} />}</span>
            {camOn ? 'Stop Video' : 'Start Video'}
          </button>
          {onPickDevice && (
            <DeviceMenu
              label="Choose camera"
              devices={cams}
              selected={selectedCam}
              onPick={(id) => onPickDevice('video', id)}
            />
          )}
        </div>
      )}
      {!lobby && (
        <>
          {onShareScreen && (
            <button
              type="button"
              className="cc__btn"
              onClick={onShareScreen}
              aria-pressed={Boolean(sharing)}
            >
              <span className="cc__icon">
                <MonitorUp size={18} />
              </span>
              {sharing ? 'Stop Sharing' : 'Share Screen'}
            </button>
          )}
          {onPickQuality && <QualityMenu quality={quality} onPick={onPickQuality} />}
          {onToggleChat && (
            <button
              type="button"
              className="cc__btn"
              onClick={onToggleChat}
              aria-pressed={Boolean(chatOpen)}
            >
              <span className="cc__icon">
                <MessageSquare size={18} />
                {unread > 0 && (
                  <span className="cc__badge" aria-label={`${unread} unread messages`}>
                    {unread}
                  </span>
                )}
              </span>
              Chat
            </button>
          )}
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
