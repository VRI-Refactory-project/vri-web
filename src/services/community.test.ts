import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getConversations,
  getMessageImage,
  getMessages,
  getPeople,
  markRead,
  sendMessage,
  sendPhoto,
  sendRequest,
  sendSticker,
} from './community';

vi.mock('./api', () => ({ api: vi.fn(), apiBlob: vi.fn() }));
import { api, apiBlob } from './api';

beforeEach(() => vi.mocked(api).mockReset());

describe('community service', () => {
  it('finds people, with the search encoded, and turns photo paths into addresses', async () => {
    vi.mocked(api).mockResolvedValue([
      {
        id: 2,
        name: 'Sarah',
        location: 'Kampala',
        photo_url: '/api/v1/auth/photos/x/',
        relationship: 'none',
      },
    ]);

    const people = await getPeople(' Sarah N ');

    expect(api).toHaveBeenCalledWith('/api/v1/community/people/?search=Sarah%20N');
    expect(people[0]).toMatchObject({ id: 2, name: 'Sarah', relationship: 'none' });
    expect(people[0].photoUrl).toMatch(/\/api\/v1\/auth\/photos\/x\/$/);
  });

  it('lists everyone when there is no search', async () => {
    vi.mocked(api).mockResolvedValue([]);
    await getPeople('  ');
    expect(api).toHaveBeenCalledWith('/api/v1/community/people/');
  });

  it('sends a request and says how you now stand', async () => {
    vi.mocked(api).mockResolvedValue({ id: 5, relationship: 'connected' });

    expect(await sendRequest(7)).toBe('connected');
    expect(api).toHaveBeenCalledWith('/api/v1/community/requests/', {
      method: 'POST',
      body: JSON.stringify({ user: 7 }),
    });
  });

  it('reads conversations with their unread count and last message', async () => {
    vi.mocked(api).mockResolvedValue([
      {
        id: 3,
        person: { id: 2, name: 'Sarah', location: '', photo_url: null },
        last_message: {
          id: 9,
          body: 'Hi',
          created_at: '2026-11-14T10:00:00Z',
          sent_by_me: false,
          read: false,
        },
        unread_count: 2,
      },
      {
        id: 4,
        person: { id: 3, name: 'Dan', location: '', photo_url: null },
        last_message: null,
        unread_count: 0,
      },
    ]);

    const list = await getConversations();

    expect(list[0]).toMatchObject({ id: 3, unread: 2, lastMessage: { body: 'Hi', mine: false } });
    expect(list[1].lastMessage).toBeNull();
  });

  it('asks for older messages with before', async () => {
    vi.mocked(api).mockResolvedValue({ messages: [], has_more: true });

    const page = await getMessages(3, 40);

    expect(api).toHaveBeenCalledWith('/api/v1/community/conversations/3/messages/?before=40');
    expect(page).toEqual({ messages: [], hasMore: true });
  });

  it('posts a sticker by id, and treats a message from an older API as having no sticker', async () => {
    vi.mocked(api).mockResolvedValueOnce({
      id: 2,
      body: '',
      sticker: 'heart',
      created_at: 'x',
      sent_by_me: true,
      read: false,
    });
    expect(await sendSticker(3, 'heart')).toMatchObject({ sticker: 'heart', body: '' });
    expect(api).toHaveBeenLastCalledWith('/api/v1/community/conversations/3/messages/', {
      method: 'POST',
      body: JSON.stringify({ sticker: 'heart' }),
    });

    vi.mocked(api).mockResolvedValueOnce({
      id: 3,
      body: 'Hi',
      created_at: 'x',
      sent_by_me: false,
      read: false,
    });
    expect(await sendMessage(3, 'Hi')).toMatchObject({ sticker: '' });
  });

  it('posts a photo as a form, with the caption only when there is one', async () => {
    const reply = {
      id: 5,
      body: 'Look',
      image_url: '/api/v1/community/conversations/3/messages/5/image/',
      created_at: 'x',
      sent_by_me: true,
      read: false,
    };
    vi.mocked(api).mockResolvedValue(reply);
    const photo = new File(['x'], 'a.jpg', { type: 'image/jpeg' });

    const sent = await sendPhoto(3, photo, '  Look ');

    expect(sent.imageUrl).toBe(reply.image_url);
    const [path, init] = vi.mocked(api).mock.calls[0];
    expect(path).toBe('/api/v1/community/conversations/3/messages/');
    const form = (init as RequestInit).body as FormData;
    expect(form.get('image')).toBe(photo);
    expect(form.get('body')).toBe('Look');

    await sendPhoto(3, photo);
    const bare = (vi.mocked(api).mock.calls[1][1] as RequestInit).body as FormData;
    expect(bare.has('body')).toBe(false);
  });

  it('fetches a photo once, then reuses it; a failed fetch is tried again', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:photo');
    vi.mocked(apiBlob).mockResolvedValue(new Blob(['x']));

    expect(await getMessageImage('/p/1/')).toBe('blob:photo');
    expect(await getMessageImage('/p/1/')).toBe('blob:photo');
    expect(apiBlob).toHaveBeenCalledTimes(1);

    vi.mocked(apiBlob).mockRejectedValueOnce(new Error('down'));
    await expect(getMessageImage('/p/2/')).rejects.toThrow('down');
    await Promise.resolve();
    expect(await getMessageImage('/p/2/')).toBe('blob:photo');
    expect(apiBlob).toHaveBeenCalledTimes(3);
  });

  it('posts a message and marks a conversation read', async () => {
    vi.mocked(api).mockResolvedValueOnce({
      id: 1,
      body: 'Hello',
      created_at: 'x',
      sent_by_me: true,
      read: false,
    });
    expect(await sendMessage(3, 'Hello')).toMatchObject({ body: 'Hello', mine: true });
    expect(api).toHaveBeenLastCalledWith('/api/v1/community/conversations/3/messages/', {
      method: 'POST',
      body: JSON.stringify({ body: 'Hello' }),
    });

    vi.mocked(api).mockResolvedValueOnce(undefined);
    await markRead(3);
    expect(api).toHaveBeenLastCalledWith('/api/v1/community/conversations/3/read/', {
      method: 'POST',
    });
  });
});
