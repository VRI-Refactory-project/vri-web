import {
  ArrowLeft,
  Check,
  CheckCheck,
  FileText,
  MessagesSquare,
  Search,
  Send,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Avatar } from '../../features/community/Avatar';
import { AttachFile } from '../../features/community/AttachFile';
import { AttachPhoto } from '../../features/community/AttachPhoto';
import { ChatFile } from '../../features/community/ChatFile';
import { ChatImage } from '../../features/community/ChatImage';
import {
  asDeleted,
  fileProblem,
  formatWhen,
  markAsRead,
  mergeMessages,
  photoProblem,
  previewOf,
} from '../../features/community/chatHelpers';
import { openChatSocket } from '../../features/community/chatSocket';
import { COMMUNITY_PATH, CommunityTabs } from '../../features/community/CommunityTabs';
import { StickerPicker } from '../../features/community/StickerPicker';
import { stickerFor } from '../../features/community/stickers';
import { useInterval } from '../../features/community/useInterval';
import { describeError } from '../../services/api';
import {
  deleteMessage,
  getConversations,
  getMessages,
  markRead,
  sendFile,
  sendMessage,
  sendPhoto,
  sendSticker,
  type ChatMessage,
  type Conversation,
} from '../../services/community';
import './DeafExtras.css';
import '../../features/community/Community.css';

// While the live connection is open these are only a safety net; without it they are how the chat updates.
const LIST_REFRESH_MS = 6000;
const THREAD_REFRESH_MS = 4000;
const LIVE_LIST_REFRESH_MS = 60000;
const LIVE_THREAD_REFRESH_MS = 30000;

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
  const [doc, setDoc] = useState<File | null>(null);
  const [live, setLive] = useState(false);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const endRef = useRef<HTMLLIElement>(null);

  const requested = Number(params.get('c'));
  // No chat opens by itself: you pick one (or follow a notification link that names it).
  const activeId = conversations?.find((c) => c.id === requested)?.id ?? null;
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
  useInterval(refreshList, live ? LIVE_LIST_REFRESH_MS : LIST_REFRESH_MS);

  // A photo or file waiting to be sent belongs to the conversation it was chosen in.
  useEffect(() => {
    setPhoto(null);
    setDoc(null);
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
  useInterval(
    refreshThread,
    activeId === null ? null : live ? LIVE_THREAD_REFRESH_MS : THREAD_REFRESH_MS,
  );

  // The live connection: what the other person does shows up straight away. The handlers read the
  // open conversation through a ref, so the socket is opened once and not every time you switch chats.
  const openId = useRef<number | null>(null);
  useEffect(() => {
    openId.current = activeId;
    setConfirmingId(null);
  }, [activeId]);
  const refreshThreadNow = useRef(refreshThread);
  useEffect(() => {
    refreshThreadNow.current = refreshThread;
  }, [refreshThread]);

  useEffect(() => {
    const socket = openChatSocket({
      onMessage: (connectionId, incoming) => {
        if (connectionId === openId.current) {
          setMessages((shown) => mergeMessages(shown, [incoming]));
        }
        void refreshList();
      },
      onDeleted: (connectionId, messageId) => {
        if (connectionId === openId.current) {
          setMessages((shown) => shown.map((m) => (m.id === messageId ? asDeleted(m) : m)));
        }
        void refreshList();
      },
      onRead: (connectionId, ids) => {
        if (connectionId === openId.current) setMessages((shown) => markAsRead(shown, ids));
      },
      onOpen: () => {
        setLive(true);
        // Anything that happened while it was down.
        void refreshList();
        void refreshThreadNow.current();
      },
      onClose: () => setLive(false),
    });
    return () => socket.close();
  }, [refreshList]);

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
    } else if (doc) {
      void deliver(
        (id) => sendFile(id, doc, body),
        () => {
          setDraft('');
          setDoc(null);
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
    if (!problem) {
      setDoc(null);
      setPhoto({ file, preview: URL.createObjectURL?.(file) ?? '' });
    }
  };

  const chooseFile = (file: File) => {
    const problem = fileProblem(file);
    setSendError(problem);
    if (!problem) {
      setPhoto(null);
      setDoc(file);
    }
  };

  const sendStickerNow = (stickerId: string) => void deliver((id) => sendSticker(id, stickerId));

  const takeBack = async (messageId: number) => {
    if (activeId === null) return;
    setConfirmingId(null);
    setSendError('');
    try {
      const gone = await deleteMessage(activeId, messageId);
      setMessages((shown) => shown.map((m) => (m.id === messageId ? gone : m)));
      void refreshList();
    } catch (err) {
      setSendError(describeError(err));
    }
  };

  // Inside someone's chat you see only that chat: no list of other conversations, no search.
  const inChat = active !== null;

  return (
    <div className="dx-page">
      {!inChat && (
        <header className="dx-header">
          <h1>Messages</h1>
          <p>Chat with the Deaf people you are connected with.</p>
          <CommunityTabs />
        </header>
      )}

      {loadError && (
        <p className="dx-notice" role="alert">
          {loadError}
        </p>
      )}

      <div className={`dx-chat${inChat ? ' dx-chat--open' : ''}`}>
        {!inChat && (
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
        )}

        <section className="dx-thread" aria-label="Conversation">
          {active ? (
            <>
              <header className="cm-thread-head">
                <button
                  type="button"
                  className="cm-back"
                  aria-label="Back to messages"
                  onClick={() => setParams({})}
                >
                  <ArrowLeft size={20} aria-hidden />
                </button>
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
                    {m.deleted ? (
                      <p className="cm-deleted">
                        {m.mine ? 'You deleted this message' : 'This message was deleted'}
                      </p>
                    ) : m.sticker ? (
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
                        {m.file && <ChatFile file={m.file} />}
                        {m.body && <p>{m.body}</p>}
                      </>
                    )}
                    <small>
                      {formatWhen(m.createdAt)}
                      {m.mine && !m.deleted && (
                        <span className="cm-msg-actions">
                          {confirmingId === m.id ? (
                            <>
                              <button
                                type="button"
                                className="cm-msg-confirm"
                                onClick={() => void takeBack(m.id)}
                              >
                                Delete for everyone
                              </button>
                              <button type="button" onClick={() => setConfirmingId(null)}>
                                Keep
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              aria-label="Delete message"
                              onClick={() => setConfirmingId(m.id)}
                            >
                              <Trash2 size={14} aria-hidden />
                            </button>
                          )}
                        </span>
                      )}
                      {m.mine && !m.deleted && (
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
              {doc && (
                <div className="cm-pending">
                  <FileText className="cm-pending-file" size={32} aria-hidden />
                  <span className="cm-pending-name">{doc.name}</span>
                  <button
                    type="button"
                    aria-label="Remove file"
                    disabled={sending}
                    onClick={() => setDoc(null)}
                  >
                    <X size={16} aria-hidden />
                  </button>
                </div>
              )}
              <form className="dx-compose" onSubmit={send}>
                <StickerPicker onPick={sendStickerNow} disabled={sending} />
                <AttachPhoto onPick={choosePhoto} disabled={sending} />
                <AttachFile onPick={chooseFile} disabled={sending} />
                <input
                  aria-label={photo || doc ? 'Add a caption' : 'Write a message'}
                  placeholder={photo || doc ? 'Add a caption…' : 'Write a message…'}
                  maxLength={2000}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <button
                  type="submit"
                  className="dx-send"
                  aria-label="Send"
                  disabled={(!draft.trim() && !photo && !doc) || sending}
                >
                  <Send size={18} aria-hidden />
                </button>
              </form>
            </>
          ) : (
            <div className="cm-welcome">
              <MessagesSquare size={56} aria-hidden />
              {conversations === null ? (
                <p>Loading your conversations…</p>
              ) : (
                <>
                  <h2>Your messages</h2>
                  <p>Select a conversation to read it and reply.</p>
                  <div className="cm-welcome-actions">
                    {conversations.length > 0 && (
                      <button
                        type="button"
                        className="cm-welcome-action"
                        onClick={() => setParams({ c: String(conversations[0].id) })}
                      >
                        <Send size={22} aria-hidden />
                        <span>Send message</span>
                      </button>
                    )}
                    <Link className="cm-welcome-action" to={COMMUNITY_PATH}>
                      <Users size={22} aria-hidden />
                      <span>Community</span>
                    </Link>
                  </div>
                </>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
