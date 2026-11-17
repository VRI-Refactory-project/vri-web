import { api, apiBlob } from './api';
import { photoSrc } from './photos';

/** How you stand with another person. */
export type Relationship = 'none' | 'request_sent' | 'request_received' | 'connected';

export interface Person {
  id: number;
  name: string;
  location: string;
  /** A full address for the picture, or null. */
  photoUrl: string | null;
}

export interface CommunityMember extends Person {
  relationship: Relationship;
}

export interface ConnectionRequest {
  id: number;
  person: Person;
  createdAt: string;
}

export interface Connection {
  /** The connection id, also the conversation id. */
  id: number;
  person: Person;
  connectedAt: string;
}

export interface ChatMessage {
  id: number;
  body: string;
  /** A sticker id (see features/community/stickers), or '' for a text message. */
  sticker: string;
  /** Where the attached photo is (fetch it with getMessageImage), or null. */
  imageUrl: string | null;
  createdAt: string;
  mine: boolean;
  /** The other person has opened it. Only meaningful for your own messages. */
  read: boolean;
}

export interface Conversation {
  id: number;
  person: Person;
  lastMessage: ChatMessage | null;
  unread: number;
}

export interface MessagePage {
  /** Oldest first. */
  messages: ChatMessage[];
  hasMore: boolean;
}

interface ApiPerson {
  id: number;
  name: string;
  location: string;
  photo_url: string | null;
}

interface ApiMessage {
  id: number;
  body: string;
  sticker?: string;
  image_url?: string | null;
  created_at: string;
  sent_by_me: boolean;
  read: boolean;
}

const BASE = '/api/v1/community';

const toPerson = (p: ApiPerson): Person => ({
  id: p.id,
  name: p.name,
  location: p.location,
  photoUrl: photoSrc(p.photo_url),
});

const toMessage = (m: ApiMessage): ChatMessage => ({
  id: m.id,
  body: m.body,
  sticker: m.sticker ?? '',
  imageUrl: m.image_url ?? null,
  createdAt: m.created_at,
  mine: m.sent_by_me,
  read: m.read,
});

/** Deaf people you can connect with, optionally narrowed by name or place. */
export async function getPeople(search = ''): Promise<CommunityMember[]> {
  const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
  const raw = await api<(ApiPerson & { relationship: Relationship })[]>(`${BASE}/people/${query}`);
  return raw.map((p) => ({ ...toPerson(p), relationship: p.relationship }));
}

/** Asks someone to connect. Returns how you now stand: connected if they had already asked you. */
export async function sendRequest(userId: number): Promise<Relationship> {
  const raw = await api<{ relationship: Relationship }>(`${BASE}/requests/`, {
    method: 'POST',
    body: JSON.stringify({ user: userId }),
  });
  return raw.relationship;
}

export async function getRequests(
  direction: 'incoming' | 'outgoing',
): Promise<ConnectionRequest[]> {
  const raw = await api<{ id: number; person: ApiPerson; created_at: string }[]>(
    `${BASE}/requests/?direction=${direction}`,
  );
  return raw.map((r) => ({ id: r.id, person: toPerson(r.person), createdAt: r.created_at }));
}

export const acceptRequest = (id: number) =>
  api<void>(`${BASE}/requests/${id}/accept/`, { method: 'POST' });

export const declineRequest = (id: number) =>
  api<void>(`${BASE}/requests/${id}/decline/`, { method: 'POST' });

/** Takes back a request you sent. */
export const cancelRequest = (id: number) =>
  api<void>(`${BASE}/requests/${id}/`, { method: 'DELETE' });

export async function getConnections(): Promise<Connection[]> {
  const raw = await api<{ id: number; person: ApiPerson; connected_at: string }[]>(
    `${BASE}/connections/`,
  );
  return raw.map((c) => ({ id: c.id, person: toPerson(c.person), connectedAt: c.connected_at }));
}

export async function getConversations(): Promise<Conversation[]> {
  const raw = await api<
    { id: number; person: ApiPerson; last_message: ApiMessage | null; unread_count: number }[]
  >(`${BASE}/conversations/`);
  return raw.map((c) => ({
    id: c.id,
    person: toPerson(c.person),
    lastMessage: c.last_message ? toMessage(c.last_message) : null,
    unread: c.unread_count,
  }));
}

/** The newest messages, or the ones before message `before`. */
export async function getMessages(id: number, before?: number): Promise<MessagePage> {
  const query = before === undefined ? '' : `?before=${before}`;
  const raw = await api<{ messages: ApiMessage[]; has_more: boolean }>(
    `${BASE}/conversations/${id}/messages/${query}`,
  );
  return { messages: raw.messages.map(toMessage), hasMore: raw.has_more };
}

export async function sendMessage(id: number, body: string): Promise<ChatMessage> {
  const raw = await api<ApiMessage>(`${BASE}/conversations/${id}/messages/`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
  return toMessage(raw);
}

export async function sendSticker(id: number, sticker: string): Promise<ChatMessage> {
  const raw = await api<ApiMessage>(`${BASE}/conversations/${id}/messages/`, {
    method: 'POST',
    body: JSON.stringify({ sticker }),
  });
  return toMessage(raw);
}

/** Sends a photo (up to 8 MB), with an optional caption. Throws an ApiError with a readable message. */
export async function sendPhoto(id: number, photo: File, caption = ''): Promise<ChatMessage> {
  const form = new FormData();
  form.append('image', photo);
  if (caption.trim()) form.append('body', caption.trim());
  const raw = await api<ApiMessage>(`${BASE}/conversations/${id}/messages/`, {
    method: 'POST',
    body: form,
  });
  return toMessage(raw);
}

// A photo is only seen by the two people in the chat, so it is fetched with the sign-in token and
// shown from memory. Each one is fetched once while the page is open.
const photoCache = new Map<string, Promise<string>>();

/** An address an <img> can show for a message's photo. */
export function getMessageImage(path: string): Promise<string> {
  let photo = photoCache.get(path);
  if (!photo) {
    photo = apiBlob(path).then((blob) => URL.createObjectURL(blob));
    // Do not keep a failure: the next try should ask again.
    photo.catch(() => photoCache.delete(path));
    photoCache.set(path, photo);
  }
  return photo;
}

export const markRead = (id: number) =>
  api<void>(`${BASE}/conversations/${id}/read/`, { method: 'POST' });
