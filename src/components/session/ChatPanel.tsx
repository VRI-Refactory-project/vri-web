import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Send, X } from 'lucide-react';
import type { ChatMessage } from '../../features/session/callConnection';

interface Props {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  onClose: () => void;
}

/** The call's chat: a side panel with the messages so far and a box to write the next one. */
export function ChatPanel({ messages, onSend, onClose }: Props) {
  const [text, setText] = useState('');
  const end = useRef<HTMLLIElement>(null);

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
    <aside className="chat" aria-label="Chat">
      <header className="chat__head">
        <h2>Chat</h2>
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
