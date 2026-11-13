import type { ReactNode } from 'react';
import logo from '../../assets/logo-icon.png';
import type { Call } from '../../features/session/useCall';
import { formatDuration } from '../../services/liveSession';
import { CallControls } from './CallControls';
import { ChatPanel } from './ChatPanel';
import { VideoTile } from './VideoTile';
import '../../pages/session/LiveSessionPage.css';
import './CallScreen.css';

interface Props {
  call: Call;
  selfName: string;
  selfPicture?: string | null;
  /** The person whose tile gets the purple outline (the interpreter, for the Deaf user). */
  highlightName?: string;
  /** Anything that belongs under the header, like the status banner or the invite button. */
  headerExtra?: ReactNode;
  /** Leave the call, keeping the session going for the others. */
  onLeave: () => void;
  /** Only the Deaf user ends the session for everyone. Leave out for everyone else. */
  onEnd?: () => void;
}

/**
 * The call, as every role sees it: the SignConnect header, the video tiles, the chat and the
 * purple control bar. Which buttons show depends on how the person chose to join (call.mode)
 * and on whether they may end the session (onEnd).
 */
export function CallScreen({
  call,
  selfName,
  selfPicture,
  highlightName,
  headerExtra,
  onLeave,
  onEnd,
}: Props) {
  const { media, mode } = call;

  return (
    <main className="ls ls--call">
      <header className="ls-top">
        <span className="ls-brand">
          <img className="ls-brand__logo" src={logo} alt="" />
          SignConnect
        </span>
        <span className="ls-timer" aria-label="Call length">
          {formatDuration(call.seconds)}
        </span>
      </header>

      {headerExtra && <div className="ls-call-header">{headerExtra}</div>}

      <div className="ls-body">
        <div className="ls-stage">
          <VideoTile
            name={selfName}
            stream={media.stream}
            cameraOff={!media.camOn}
            muted
            profilePicture={selfPicture}
            highlight
          />
          {call.others.map((person) => (
            <VideoTile
              key={person.id}
              name={person.name}
              stream={person.stream}
              cameraOff={person.cameraOff}
              screen={person.screen}
              highlight={person.name === highlightName}
            />
          ))}
          {call.others.length === 0 && (
            <div className="vt ls-waiting" role="status">
              Waiting for others to join…
            </div>
          )}
        </div>

        {call.chatOpen && (
          <ChatPanel
            messages={call.messages}
            onSend={call.sendChat}
            onClose={() => call.openChat(false)}
          />
        )}
      </div>

      {(call.accessNotice ?? call.error) && (
        <p className="ls-error" role="alert">
          {call.accessNotice ?? call.error}
        </p>
      )}

      <CallControls
        micOn={media.micOn}
        camOn={media.camOn}
        onToggleMic={call.toggleMic}
        onToggleCam={call.toggleCam}
        canMic={mode.audio}
        canCam={mode.video}
        mics={media.mics}
        cams={media.cams}
        selectedMic={media.selectedMic}
        selectedCam={media.selectedCam}
        onPickDevice={(kind, id) => void call.pickDevice(kind, id)}
        onShareScreen={mode.video ? call.toggleShare : undefined}
        sharing={call.sharing}
        onToggleChat={() => call.openChat(!call.chatOpen)}
        chatOpen={call.chatOpen}
        unread={call.unread}
        onLeave={onLeave}
        onEnd={onEnd ?? (() => undefined)}
        canEnd={Boolean(onEnd)}
      />
    </main>
  );
}
