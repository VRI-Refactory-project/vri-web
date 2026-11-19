import { useState, type FormEvent } from 'react';
import { Mic, MicOff, Pencil, Video, VideoOff, X } from 'lucide-react';
import { MAX_NAME_LENGTH, type CallRole } from '../../features/session/callConnection';
import { ROLE_LABEL } from '../../features/session/roles';

/** One person in the list. */
export interface Participant {
  id: string;
  name: string;
  role?: CallRole;
  self?: boolean;
  handRaised?: boolean;
  cameraOff?: boolean;
  micOff?: boolean;
  /** True when the person looking at the list may remove this one from the call. */
  removable?: boolean;
}

interface Props {
  people: Participant[];
  onClose: () => void;
  /** Lets you change your own name. Leave out to hide the pencil. */
  onRename?: (name: string) => void;
  /** Removes someone from the call. Only the Deaf user gets this. */
  onRemove?: (id: string) => Promise<unknown> | void;
}

/** Everyone in the call, with their tag, a raised hand, and whether their camera or mic is off. */
export function ParticipantsPanel({ people, onClose, onRename, onRemove }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  // The person we are asking "remove?" about, and any problem from the last try.
  const [confirming, setConfirming] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const saveName = (event: FormEvent) => {
    event.preventDefault();
    if (draft.trim()) onRename?.(draft);
    setEditing(false);
  };

  const remove = async (person: Participant) => {
    setProblem(null);
    try {
      await onRemove?.(person.id);
      setConfirming(null);
    } catch {
      setProblem(`Could not remove ${person.name}. Please try again.`);
    }
  };

  return (
    <aside className="chat pp" aria-label="Participants">
      <header className="chat__head">
        <h2>Participants ({people.length})</h2>
        <button
          type="button"
          className="chat__close"
          onClick={onClose}
          aria-label="Close participants"
        >
          <X size={18} />
        </button>
      </header>
      {problem && (
        <p className="pp__problem" role="alert">
          {problem}
        </p>
      )}
      <ul className="pp__list">
        {people.map((person) => (
          <li key={person.id} className="pp__row">
            <span className="pp__who">
              {person.self && editing ? (
                <form className="pp__rename" onSubmit={saveName}>
                  <input
                    autoFocus
                    value={draft}
                    maxLength={MAX_NAME_LENGTH}
                    aria-label="Edit your name in this call"
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => e.key === 'Escape' && setEditing(false)}
                  />
                  <button type="submit" disabled={!draft.trim()}>
                    Save
                  </button>
                </form>
              ) : (
                <span className="pp__name">
                  {person.name}
                  {person.self && ' (You)'}
                  {person.self && onRename && (
                    <button
                      type="button"
                      className="pp__edit"
                      aria-label="Edit your name"
                      onClick={() => {
                        setDraft(person.name);
                        setEditing(true);
                      }}
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                  {person.handRaised && (
                    <span role="img" aria-label="hand raised">
                      {' '}
                      ✋
                    </span>
                  )}
                </span>
              )}
              {person.role && <span className="pp__tag">{ROLE_LABEL[person.role]}</span>}
            </span>
            <span className="pp__state">
              {person.micOff !== undefined &&
                (person.micOff ? (
                  <MicOff size={16} aria-label="Microphone off" />
                ) : (
                  <Mic size={16} aria-label="Microphone on" />
                ))}
              {person.cameraOff ? (
                <VideoOff size={16} aria-label="Camera off" />
              ) : (
                <Video size={16} aria-label="Camera on" />
              )}
              {person.removable &&
                onRemove &&
                (confirming === person.id ? (
                  <span className="pp__confirm">
                    <button
                      type="button"
                      className="pp__danger"
                      aria-label={`Yes, remove ${person.name}`}
                      onClick={() => remove(person)}
                    >
                      Yes, remove
                    </button>
                    <button type="button" onClick={() => setConfirming(null)}>
                      Cancel
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    className="pp__remove"
                    aria-label={`Remove ${person.name}`}
                    onClick={() => setConfirming(person.id)}
                  >
                    Remove
                  </button>
                ))}
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
