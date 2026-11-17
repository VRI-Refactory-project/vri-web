import { Check, CheckCheck, Search, Send, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Avatar } from '../../features/community/Avatar';
import { AttachPhoto } from '../../features/community/AttachPhoto';
import { ChatImage } from '../../features/community/ChatImage';
import {
  formatWhen,
  mergeMessages,
  photoProblem,
  previewOf,
} from '../../features/community/chatHelpers';
import { COMMUNITY_PATH, CommunityTabs } from '../../features/community/CommunityTabs';
import { StickerPicker } from '../../features/community/StickerPicker';
import { stickerFor } from '../../features/community/stickers';
import { useInterval } from '../../features/community/useInterval';
import { describeError } from '../../services/api';
import {
  getConversations,
  getMessages,
  markRead,
  sendMessage,
  sendPhoto,
  sendSticker,
  type ChatMessage,
  type Conversation,
} from '../../services/community';
import './DeafExtras.css';
import '../../features/community/Community.css';

const LIST_REFRESH_MS = 6000;
const THREAD_REFRESH_MS = 4000;

/** Your conversations with the Deaf people you are connected with. */
export function MessagesPage() {
  const [params, setParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [photo, setPhoto] = useState<{ file: File; preview: string } | null>(null);
  const endRef = useRef<HTMLLIElement>(null);

  const requested = Number(params.get('c'));
  const activeId =
    conversations?.find((c) => c.id === requested)?.id ?? conversations?.[0]?.id ?? null;
  const active = conversations?.find((c) => c.id === activeId) ?? null;

  const refreshList = useCallback(async () => {
    try {
      setConversations(await getConversations());
      setLoadError('');
    } catch (err) {
      // Keep what is shown; only say something when there is nothing to show yet.
      setLoadError((now) => now || describeError(err));
    }
  }, []);

  useEffect(() => {
    void refreshList();
  }, [refreshList]);
  useInterval(refreshList, LIST_REFRESH_MS);

  // A photo waiting to be sent belongs to the conversation it was chosen in.
  useEffect(() => {
    setPhoto(null);
  }, [activeId]);
  const previewUrl = photo?.preview;
  useEffect(() => () => (previewUrl ? URL.revokeObjectURL?.(previewUrl) : undefined), [previewUrl]);

  // Opening a conversation shows its newest messages.
  useEffect(() => {
    setMessages([]);
    setHasMore(false);
    setSendError('');
    if (activeId === null) return;
    let cancelled = false;
    getMessages(activeId).then(
      (page) => {
        if (cancelled) return;
        setMessages(page.messages);
        setHasMore(page.hasMore);
      },
      () => undefined,
    );
    return () => {
      cancelled = true;
    };
  }, [activeId]);

  const refreshThread = useCallback(async () => {
    if (activeId === null) return;
    try {
      const page = await getMessages(activeId);
      setMessages((shown) => mergeMessages(shown, page.messages));
    } catch {
      // The next tick tries again.
    }
  }, [activeId]);
  useInterval(refreshThread, activeId === null ? null : THREAD_REFRESH_MS);

  // Opening a conversation with unread messages reads them, and it keeps doing so while it stays open.
  const unread = active?.unread ?? 0;
  useEffect(() => {
    if (activeId === null || unread === 0) return;
    markRead(activeId).then(
      () =>
        setConversations((list) =>
          (list ?? []).map((c) => (c.id === activeId ? { ...c, unread: 0 } : c)),
        ),
      () => undefined,
    );
  }, [activeId, unread]);

  const newest = messages[messages.length - 1]?.id;
  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: 'end' });
  }, [newest]);

  const shown = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (conversations ?? []).filter((c) => c.person.name.toLowerCase().includes(term));
  }, [conversations, search]);

  const loadOlder = async () => {
    if (activeId === null || messages.length === 0) return;
    try {
      const page = await getMessages(activeId, messages[0].id);
      setMessages((now) => mergeMessages(page.messages, now));
      setHasMore(page.hasMore);
    } catch (err) {
      setSendError(describeError(err));
    }
  };

  const deliver = async (post: (id: number) => Promise<ChatMessage>, then?: () => void) => {
    if (activeId === null || sending) return;
    setSending(true);
    setSendError('');
    try {
      const sent = await post(activeId);
      setMessages((now) => mergeMessages(now, [sent]));
      then?.();
      void refreshList();
    } catch (err) {
      setSendError(describeError(err));
    } finally {
      setSending(false);
    }
  };

  const send = (e: FormEvent) => {
    e.preventDefault();
    const body = draft.trim();
    if (photo) {
      const { file } = photo;
      void deliver(
        (id) => sendPhoto(id, file, body),
        () => {
          setDraft('');
          setPhoto(null);
        },
      );
    } else if (body) {
      void deliver(
        (id) => sendMessage(id, body),
        () => setDraft(''),
      );
    }
  };

  const choosePhoto = (file: File) => {
    const problem = photoProblem(file);
    setSendError(problem);
    if (!problem) setPhoto({ file, preview: URL.createObjectURL?.(file) ?? '' });
  };

  const sendStickerNow = (stickerId: string) => void deliver((id) => sendSticker(id, stickerId));

  return (
    <div className="dx-page">
      <header className="dx-header">
        <h1>Messages</h1>
        <p>Chat with the Deaf people you are connected with.</p>
        <CommunityTabs />
      </header>

      {loadError && (
        <p className="dx-notice" role="alert">
          {loadError}
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
          {conversations !== null && conversations.length === 0 ? (
            <p className="cm-note">
              No conversations yet. <Link to={COMMUNITY_PATH}>Find people in Community</Link> and
              connect to start chatting.
            </p>
          ) : (
            <ul className="dx-list">
              {shown.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className={`dx-convo${c.id === activeId ? ' dx-convo--on' : ''}`}
                    aria-current={c.id === activeId ? 'true' : undefined}
                    onClick={() => setParams({ c: String(c.id) })}
                  >
                    <Avatar name={c.person.name} photoUrl={c.person.photoUrl} />
                    <span className="dx-tx-text">
                      <strong>{c.person.name}</strong>
                      <small>{c.lastMessage ? previewOf(c.lastMessage) : 'Say hello'}</small>
                    </span>
                    {c.lastMessage && <small>{formatWhen(c.lastMessage.createdAt)}</small>}
                    {c.unread > 0 && (
                      <span className="cm-badge" aria-label={`${c.unread} unread`}>
                        {c.unread}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className="dx-thread" aria-label="Conversation">
          {active ? (
            <>
              <header className="cm-thread-head">
                <Avatar name={active.person.name} photoUrl={active.person.photoUrl} />
                <div>
                  <strong>{active.person.name}</strong>
                  {active.person.location && <small>{active.person.location}</small>}
                </div>
              </header>
              <ul className="dx-messages cm-messages">
                {hasMore && (
                  <li style={{ alignSelf: 'center' }}>
                    <button type="button" className="cm-more" onClick={loadOlder}>
                      Load earlier messages
                    </button>
                  </li>
                )}
                {messages.map((m) => (
                  <li
                    key={m.id}
                    className={`dx-msg${m.mine ? ' dx-msg--mine' : ''}${m.sticker ? ' cm-msg--sticker' : ''}`}
                  >
                    {m.sticker ? (
                      <p
                        className="cm-sticker"
                        role="img"
                        aria-label={stickerFor(m.sticker)?.label ?? 'Sticker'}
                      >
                        {stickerFor(m.sticker)?.emoji ?? '🙂'}
                      </p>
                    ) : (
                      <>
                        {m.imageUrl && (
                          <ChatImage key={m.imageUrl} path={m.imageUrl} alt={m.body || 'Photo'} />
                        )}
                        {m.body && <p>{m.body}</p>}
                      </>
                    )}
                    <small>
                      {formatWhen(m.createdAt)}
                      {m.mine && (
                        <span
                          className={`cm-ticks${m.read ? ' cm-ticks--read' : ''}`}
                          role="img"
                          aria-label={m.read ? 'Read' : 'Sent'}
                        >
                          {m.read ? <CheckCheck size={14} /> : <Check size={14} />}
                        </span>
                      )}
                    </small>
                  </li>
                ))}
                <li ref={endRef} aria-hidden="true" />
              </ul>
              {sendError && (
                <p className="cm-error" role="alert">
                  {sendError}
                </p>
              )}
              {photo && (
                <div className="cm-pending">
                  {photo.preview && <img src={photo.preview} alt="Photo ready to send" />}
                  <span>Add a caption if you like, then send.</span>
                  <button
                    type="button"
                    aria-label="Remove photo"
                    disabled={sending}
                    onClick={() => setPhoto(null)}
                  >
                    <X size={16} aria-hidden />
                  </button>
                </div>
              )}
              <form className="dx-compose" onSubmit={send}>
                <StickerPicker onPick={sendStickerNow} disabled={sending} />
                <AttachPhoto onPick={choosePhoto} disabled={sending} />
                <input
                  aria-label={photo ? 'Add a caption' : 'Write a message'}
                  placeholder={photo ? 'Add a caption…' : 'Write a message…'}
                  maxLength={2000}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <button
                  type="submit"
                  className="dx-send"
                  aria-label="Send"
                  disabled={(!draft.trim() && !photo) || sending}
                >
                  <Send size={18} aria-hidden />
                </button>
              </form>
            </>
          ) : (
            <p className="dx-empty">
              {conversations === null
                ? 'Loading your conversations…'
                : 'Select a conversation to read it.'}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
