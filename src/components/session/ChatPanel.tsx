import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import { Minus, Plus, Send, X } from 'lucide-react';
import type { ChatMessage } from '../../features/session/callConnection';

interface Props {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  onClose: () => void;
}

/** Text sizes in rem. The default (second) is already large, because small text is hard to read. */
const SIZES = [1, 1.25, 1.5, 1.8];
const DEFAULT_SIZE = 1;
const STORAGE_KEY = 'chat-text-size';

function loadSize() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === null) return DEFAULT_SIZE;
    const saved = Number(stored);
    return Number.isInteger(saved) && saved >= 0 && saved < SIZES.length ? saved : DEFAULT_SIZE;
  } catch {
    return DEFAULT_SIZE;
  }
}

/** The call's chat: a side panel with the messages so far and a box to write the next one. */
export function ChatPanel({ messages, onSend, onClose }: Props) {
  const [text, setText] = useState('');
  const end = useRef<HTMLLIElement>(null);
  const [size, setSize] = useState(loadSize);

  const changeSize = (next: number) => {
    const clamped = Math.min(SIZES.length - 1, Math.max(0, next));
    setSize(clamped);
    try {
      localStorage.setItem(STORAGE_KEY, String(clamped));
    } catch {
      // the size just will not be remembered
    }
  };

  // Keep the newest message in view.
  useEffect(() => {
    end.current?.scrollIntoView?.({ block: 'end' });
  }, [messages.length]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text);
    setText('');
  };

  return (
    <aside
      className="chat"
      aria-label="Chat"
      style={{ '--chat-size': `${SIZES[size]}rem` } as CSSProperties}
    >
      <header className="chat__head">
        <h2>Chat</h2>
        <div className="chat__size" role="group" aria-label="Text size">
          <button
            type="button"
            onClick={() => changeSize(size - 1)}
            disabled={size === 0}
            aria-label="Smaller text"
          >
            <Minus size={16} />
          </button>
          <button
            type="button"
            onClick={() => changeSize(size + 1)}
            disabled={size === SIZES.length - 1}
            aria-label="Larger text"
          >
            <Plus size={16} />
          </button>
        </div>
        <button type="button" className="chat__close" onClick={onClose} aria-label="Close chat">
          <X size={18} />
        </button>
      </header>
      <ul className="chat__list">
        {messages.length === 0 && <li className="chat__empty">No messages yet.</li>}
        {messages.map((m) => (
          <li key={m.id} className={`chat__msg${m.mine ? ' chat__msg--mine' : ''}`}>
            <span className="chat__from">{m.from}</span>
            <span className="chat__text">{m.text}</span>
          </li>
        ))}
        <li ref={end} aria-hidden="true" />
      </ul>
      <form className="chat__form" onSubmit={submit}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a message"
          aria-label="Message"
          maxLength={2000}
        />
        <button type="submit" aria-label="Send message" disabled={!text.trim()}>
          <Send size={18} />
        </button>
      </form>
    </aside>
  );
}
