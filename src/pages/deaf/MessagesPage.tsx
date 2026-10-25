import { MessageSquare, Search, Send } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  getConversations,
  matchesSearch,
  withSentMessage,
  type Conversation,
} from '../../services/messages';
import './DeafExtras.css';

const clock = () => new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

export function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState('');

  useEffect(() => {
    let cancelled = false;
    getConversations().then((list) => {
      if (cancelled) return;
      setConversations(list);
      setActiveId(list[0]?.id ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const shown = useMemo(
    () => (conversations ?? []).filter((c) => matchesSearch(c, search)),
    [conversations, search],
  );
  const active = conversations?.find((c) => c.id === activeId) ?? null;

  const send = (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !active) return;
    setConversations((list) =>
      (list ?? []).map((c) => (c.id === active.id ? withSentMessage(c, text, clock()) : c)),
    );
    setDraft('');
  };

  return (
    <div className="dx-page">
      <header className="dx-header">
        <h1>Chat</h1>
        <p>Message your interpreters and the SignConnect support team.</p>
      </header>

      {conversations !== null && conversations.length === 0 && (
        <p className="dx-notice" role="status">
          Messaging is not live yet. Your conversations will appear here once it is.
        </p>
      )}

      <div className="dx-chat">
        <aside className="dx-chat-list" aria-label="Conversations">
          <label className="dx-search">
            <Search size={16} aria-hidden />
            <input
              type="search"
              aria-label="Search conversations"
              placeholder="Search conversations"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <ul className="dx-list">
            {shown.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className={`dx-convo${c.id === activeId ? ' dx-convo--on' : ''}`}
                  onClick={() => setActiveId(c.id)}
                >
                  <span className="dx-icon">
                    <MessageSquare size={18} aria-hidden />
                  </span>
                  <span className="dx-tx-text">
                    <strong>{c.name}</strong>
                    <small>{c.preview}</small>
                  </span>
                  <small>{c.when}</small>
                  {c.unread && <span className="dx-dot" aria-label="Unread" />}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="dx-thread" aria-label="Conversation">
          {active ? (
            <>
              <header className="dx-thread-head">
                <strong>{active.name}</strong>
                <small>{active.subtitle}</small>
              </header>
              <ul className="dx-messages">
                {active.messages.map((m) => (
                  <li key={m.id} className={`dx-msg${m.mine ? ' dx-msg--mine' : ''}`}>
                    <p>{m.text}</p>
                    <small>{m.time}</small>
                  </li>
                ))}
              </ul>
              <form className="dx-compose" onSubmit={send}>
                <input
                  aria-label="Write a message"
                  placeholder="Write a message…"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <button
                  type="submit"
                  className="dx-send"
                  aria-label="Send"
                  disabled={!draft.trim()}
                >
                  <Send size={18} aria-hidden />
                </button>
              </form>
            </>
          ) : (
            <p className="dx-empty">Select a conversation to read it.</p>
          )}
        </section>
      </div>
    </div>
  );
}
