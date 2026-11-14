import { useState, type ReactNode } from 'react';
import type { Call } from '../../features/session/useCall';
import type { ConnectionQuality } from '../../features/session/videoQuality';
import { formatDuration } from '../../services/liveSession';
import { BrandMark } from './BrandMark';
import { CallControls } from './CallControls';
import { ChatPanel } from './ChatPanel';
import { initials } from './initials';
import { VideoTile } from './VideoTile';
import '../../pages/session/LiveSessionPage.css';
import './CallScreen.css';

interface Props {
  call: Call;
  selfName: string;
  selfPicture?: string | null;
  /** Shown top-right beside the profile photo. Guests have no account, so they show nothing. */
  selfEmail?: string | null;
  /** The person whose tile gets the purple outline (the interpreter, for the Deaf user). */
  highlightName?: string;
  /** Anything that belongs under the header, like the status banner or the invite button. */
  headerExtra?: ReactNode;
  /** Leave the call, keeping the session going for the others. */
  onLeave: () => void;
  /** Only the Deaf user ends the session for everyone. Leave out for everyone else. */
  onEnd?: () => void;
}

/** One tile on the screen, whoever or whatever it shows. */
interface Tile {
  id: string;
  name: string;
  stream: MediaStream | null;
  cameraOff: boolean;
  muted?: boolean;
  picture?: string | null;
  screen?: boolean;
  quality?: ConnectionQuality;
  self?: boolean;
}

const SELF = 'self';

/**
 * The call, as every role sees it (the Figma design): the SignConnect logo and the person's profile
 * at the top, one big tile with the others beside it, the chat, and the purple control bar. Which
 * buttons show depends on how the person chose to join (call.mode) and on whether they may end the
 * session (onEnd).
 */
export function CallScreen({
  call,
  selfName,
  selfPicture,
  selfEmail,
  highlightName,
  headerExtra,
  onLeave,
  onEnd,
}: Props) {
  const { media, mode } = call;
  // The tile the person chose to make big. Nothing chosen means the screen picks one itself.
  const [pinned, setPinned] = useState<string | null>(null);

  const tiles: Tile[] = [
    {
      id: SELF,
      name: selfName,
      stream: media.stream,
      cameraOff: !media.camOn,
      muted: true,
      picture: selfPicture,
      quality: call.selfQuality,
      self: true,
    },
    ...call.others.map((person) => ({
      id: person.id,
      name: person.name,
      stream: person.stream,
      cameraOff: person.cameraOff,
      screen: person.screen,
      quality: person.quality,
    })),
  ];

  // Without a choice: a shared screen first, then the other person, and only you when alone.

  const main = tiles.find((tile) => tile.id === pinned);

  const tileFor = (tile: Tile) => (
    <VideoTile
      key={tile.id}
      name={tile.name}
      stream={tile.stream}
      cameraOff={tile.cameraOff}
      muted={tile.muted}
      profilePicture={tile.picture}
      screen={tile.screen}
      quality={tile.quality}
      highlight={tile.self || tile.name === highlightName}
      spotlighted={pinned === tile.id}
      onSpotlight={() => setPinned((current) => (current === tile.id ? null : tile.id))}
    />
  );

  return (
    <main className="ls ls--call">
      <header className="ls-top">
        <BrandMark />
        <span className="ls-top__right">
          <span className="ls-timer" aria-label="Call length">
            {formatDuration(call.seconds)}
          </span>
          {selfEmail && (
            <span className="ls-profile">
              <span className="ls-profile__email">{selfName}</span>

              {selfPicture ? (
                <img
                  className="ls-profile__photo"
                  src={selfPicture}
                  alt={`${selfName}'s profile`}
                />
              ) : (
                <span
                  className="ls-profile__photo ls-profile__photo--initials"
                  aria-label={`${selfName}'s profile`}
                >
                  {initials(selfName)}
                </span>
              )}
            </span>
          )}
        </span>
      </header>

      {headerExtra && <div className="ls-call-header">{headerExtra}</div>}

      <div className="ls-body">
        <div className="ls-spot">
          {main ? (
            <>
              <div className="ls-main">{tileFor(main)}</div>

              <div className="ls-side">
                {tiles.filter((tile) => tile.id !== main.id).map(tileFor)}
              </div>
            </>
          ) : (
            <div
              className="ls-grid"
              style={{
                gridTemplateColumns: `repeat(${Math.min(tiles.length, 4)}, minmax(0, 1fr))`,
              }}
            >
              {tiles.map(tileFor)}
            </div>
          )}

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
        quality={call.quality}
        onPickQuality={call.pickQuality}
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
