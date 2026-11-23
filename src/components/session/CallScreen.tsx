import { useRef, useState, type ReactNode } from 'react';
import { MonitorUp } from 'lucide-react';
import type { CallRole } from '../../features/session/callConnection';
import { usePictureInPicture } from '../../features/session/pictureInPicture';
import { pickSpotlight } from '../../features/session/spotlight';
import type { Call } from '../../features/session/useCall';
import type { ConnectionQuality } from '../../features/session/videoQuality';
import { formatDuration } from '../../services/liveSession';
import { AloneCheck } from './AloneCheck';
import { BrandMark } from './BrandMark';
import { CallControls } from './CallControls';
import { ChatPanel } from './ChatPanel';
import { initials } from './initials';
import { ParticipantsPanel } from './ParticipantsPanel';
import { PipView } from './PipView';
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
  /**
   * What happens when the person has been alone for 5 minutes and does not answer "Are you still
   * there?". Defaults to leaving the call.
   */
  onAloneTimeout?: () => void;
  /** Only the Deaf user removes a hearing guest. Gets the guest's invitation number. */
  onRemoveGuest?: (invitationId: number) => Promise<unknown>;
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
  role?: CallRole;
  handRaised?: boolean;
  self?: boolean;
}

const SELF = 'self';
const SELF_SCREEN = 'self#screen';

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
  onAloneTimeout,
  onRemoveGuest,
}: Props) {
  const { media, mode } = call;
  // The name you picked in the call wins over your account name, for you and for the others.
  const shownName = call.renamedTo ?? selfName;
  // The tile the person chose to make big. Nothing chosen means the screen picks one itself.
  const [pinned, setPinned] = useState<string | null>(null);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  // Picture-in-picture keeps the big tile on top while the person works in other tabs. Where only a
  // video can float (Safari), it is the big tile's video.
  const stage = useRef<HTMLDivElement>(null);
  const pip = usePictureInPicture(() => stage.current?.querySelector('video') ?? null);

  const tiles: Tile[] = [
    {
      id: SELF,
      name: shownName,
      role: call.selfRole,
      stream: media.stream,
      cameraOff: !media.camOn,
      muted: true,
      picture: selfPicture,
      quality: call.selfQuality,
      handRaised: call.handRaised,
      self: true,
    },
    // What you are sharing, as the others see it. Like theirs, it becomes the big tile.
    ...(call.selfScreen
      ? [
          {
            id: SELF_SCREEN,
            name: 'Your screen',
            stream: call.selfScreen,
            cameraOff: false,
            muted: true,
            screen: true,
          },
        ]
      : []),
    ...call.others.map((person) => ({
      id: person.id,
      name: person.name,
      role: person.role,
      stream: person.stream,
      cameraOff: person.cameraOff,
      screen: person.screen,
      quality: person.quality,
      handRaised: person.handRaised,
    })),
  ];

  // A shared screen is its own tile, but it is not a person, so it is not in the people list.
  const people = tiles
    .filter((tile) => !tile.screen)
    .map((tile) => ({
      id: tile.id,
      name: tile.name,
      role: tile.role,
      self: tile.self,
      handRaised: tile.handRaised,
      cameraOff: tile.cameraOff,
      removable: Boolean(onRemoveGuest) && tile.id.startsWith('guest-'),
    }));

  // The big tile: the one the person pinned, or else the screen's own choice (see pickSpotlight).
  // There is always one, because your own tile is always there.
  const mainId = pickSpotlight(tiles, pinned, call.selfRole);
  const main = tiles.find((tile) => tile.id === mainId) ?? tiles[0];
  const side = tiles.filter((tile) => tile.id !== main.id);
  const isPinned = (tile: Tile) => pinned === tile.id && tile.id === main.id;

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
      role={tile.role}
      handRaised={tile.handRaised}
      onRename={tile.self ? call.rename : undefined}
      highlight={
        tile.self ||
        tile.name === highlightName ||
        (highlightName !== undefined && tile.role === 'interpreter')
      }
      spotlighted={isPinned(tile)}
      // A small tile can be pinned, and a pinned tile unpinned. The big tile the screen chose by
      // itself has no button: pinning it would change nothing.
      onSpotlight={
        tile.id !== main.id
          ? () => setPinned(tile.id)
          : isPinned(tile)
            ? () => setPinned(null)
            : undefined
      }
    />
  );

  return (
    <main className="ls ls--call">
      <header className="ls-top">
        <BrandMark />
        <span className="ls-top__right">
          <span className="ls-live" role="status">
            <i aria-hidden="true" />
            LIVE
          </span>
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

      {call.sharing && (
        <div className="ls-presenting" role="status">
          <MonitorUp size={18} aria-hidden="true" />
          <span>You’re presenting your screen to everyone</span>
          <button type="button" className="ls-presenting__stop" onClick={call.toggleShare}>
            Stop presenting
          </button>
        </div>
      )}

      <div className="ls-body">
        <div className="ls-spot">
          <div className="ls-main" ref={stage}>
            {tileFor(main)}
            {/* Alone, you fill the stage (as in Google Meet): no empty tile, just a note. */}
            {call.others.length === 0 && (
              <p className="ls-waiting" role="status">
                Waiting for others to join…
              </p>
            )}
          </div>

          {side.length > 0 && <div className="ls-side">{side.map(tileFor)}</div>}
        </div>

        {participantsOpen && (
          <ParticipantsPanel
            people={people}
            onClose={() => setParticipantsOpen(false)}
            onRename={call.rename}
            onRemove={
              onRemoveGuest ? (id) => onRemoveGuest(Number(id.slice('guest-'.length))) : undefined
            }
          />
        )}

        {call.chatOpen && (
          <ChatPanel
            messages={call.messages}
            onSend={call.sendChat}
            onClose={() => call.openChat(false)}
          />
        )}
      </div>

      {pip.pipWindow && (
        <PipView
          pipWindow={pip.pipWindow}
          micOn={media.micOn}
          camOn={media.camOn}
          canMic={mode.audio}
          canCam={mode.video}
          onToggleMic={call.toggleMic}
          onToggleCam={call.toggleCam}
          onLeave={onLeave}
        >
          {/* Muted: the sound already plays on the call screen, and must not play twice. */}
          <VideoTile
            name={main.name}
            stream={main.stream}
            cameraOff={main.cameraOff}
            muted
            profilePicture={main.picture}
            screen={main.screen}
            role={main.role}
            handRaised={main.handRaised}
          />
        </PipView>
      )}

      {/* Only there while nobody else is in the call, so someone joining resets it. */}
      {call.others.every((person) => person.screen) && (
        <AloneCheck ends={Boolean(onEnd)} onTimeout={onAloneTimeout ?? onLeave} />
      )}

      <ul className="ls-reactions" role="status" aria-live="polite">
        {call.reactions.map((reaction) => (
          <li key={reaction.id} className="ls-reaction">
            <span>{reaction.from}</span>
            <span aria-hidden="true"> {reaction.emoji} </span>
            <span>{reaction.label}</span>
          </li>
        ))}
      </ul>

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
        onPopOut={pip.kind ? () => (pip.pipWindow ? pip.close() : void pip.open()) : undefined}
        poppedOut={Boolean(pip.pipWindow)}
        sharing={call.sharing}
        quality={call.quality}
        onPickQuality={call.pickQuality}
        onToggleChat={() => {
          setParticipantsOpen(false);
          call.openChat(!call.chatOpen);
        }}
        onToggleHand={call.toggleHand}
        handRaised={call.handRaised}
        onReact={call.react}
        onToggleParticipants={() => {
          if (!participantsOpen) call.openChat(false);
          setParticipantsOpen((open) => !open);
        }}
        participantCount={people.length}
        chatOpen={call.chatOpen}
        unread={call.unread}
        onLeave={onLeave}
        onEnd={onEnd ?? (() => undefined)}
        canEnd={Boolean(onEnd)}
      />
    </main>
  );
}
