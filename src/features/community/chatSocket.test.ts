import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createChatSocketOpener } from './chatSocket';

class FakeWebSocket {
  static instances: FakeWebSocket[] = [];
  onmessage: ((e: { data: string }) => void) | null = null;
  onclose: ((e: { code: number }) => void) | null = null;
  closed = false;
  url: string;
  constructor(url: string) {
    this.url = url;
    FakeWebSocket.instances.push(this);
  }
  close() {
    this.closed = true;
  }
  say(data: unknown) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }
  drop(code: number) {
    this.onclose?.({ code });
  }
}

function setup(fetchTicket = vi.fn().mockResolvedValue({ ticket: 't1' })) {
  const open = createChatSocketOpener({
    fetchTicket,
    createWebSocket: (url) => new FakeWebSocket(url) as unknown as WebSocket,
    baseUrl: 'ws://api.test',
  });
  const events = {
    onMessage: vi.fn(),
    onDeleted: vi.fn(),
    onRead: vi.fn(),
    onOpen: vi.fn(),
    onClose: vi.fn(),
  };
  const socket = open(events);
  return { fetchTicket, events, socket };
}

const settle = () => vi.advanceTimersByTimeAsync(0);

describe('chat socket', () => {
  beforeEach(() => {
    FakeWebSocket.instances = [];
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  it('connects with a ticket and says when it is ready', async () => {
    const { events } = setup();
    await settle();
    const ws = FakeWebSocket.instances[0];
    expect(ws.url).toBe('ws://api.test/ws/community/?ticket=t1');

    ws.say({ type: 'community.ready' });

    expect(events.onOpen).toHaveBeenCalledTimes(1);
  });

  it('turns a new message into a chat message', async () => {
    const { events } = setup();
    await settle();

    FakeWebSocket.instances[0].say({
      type: 'community.message',
      connection: 4,
      message: {
        id: 9,
        body: 'Hello',
        sticker: '',
        image_url: null,
        file: null,
        created_at: '2026-11-21T10:00:00Z',
        sent_by_me: false,
        read: false,
        deleted: false,
      },
    });

    expect(events.onMessage).toHaveBeenCalledWith(4, {
      id: 9,
      body: 'Hello',
      sticker: '',
      imageUrl: null,
      file: null,
      createdAt: '2026-11-21T10:00:00Z',
      mine: false,
      read: false,
      deleted: false,
    });
  });

  it('reports deletions and read receipts', async () => {
    const { events } = setup();
    await settle();
    const ws = FakeWebSocket.instances[0];

    ws.say({ type: 'community.message_deleted', connection: 4, message_id: 9 });
    ws.say({ type: 'community.read', connection: 4, message_ids: [1, 2] });

    expect(events.onDeleted).toHaveBeenCalledWith(4, 9);
    expect(events.onRead).toHaveBeenCalledWith(4, [1, 2]);
  });

  it('ignores things it does not understand', async () => {
    const { events } = setup();
    await settle();
    const ws = FakeWebSocket.instances[0];

    ws.say({ type: 'something.else' });
    ws.say({ type: 'community.message_deleted', connection: 'x' });
    ws.say({ type: 'community.message', connection: 4 });
    ws.onmessage?.({ data: 'not json' });

    expect(events.onMessage).not.toHaveBeenCalled();
    expect(events.onDeleted).not.toHaveBeenCalled();
    expect(events.onRead).not.toHaveBeenCalled();
  });

  it('asks for a new ticket and reconnects after a drop, telling the page meanwhile', async () => {
    const { fetchTicket, events } = setup();
    await settle();

    FakeWebSocket.instances[0].drop(1006);
    expect(events.onClose).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1000);

    expect(fetchTicket).toHaveBeenCalledTimes(2);
    expect(FakeWebSocket.instances).toHaveLength(2);
  });

  it('keeps trying when it cannot get a ticket', async () => {
    const fetchTicket = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue({ ticket: 't2' });
    setup(fetchTicket);
    await settle();
    expect(FakeWebSocket.instances).toHaveLength(0);

    await vi.advanceTimersByTimeAsync(1000);

    expect(FakeWebSocket.instances[0].url).toContain('ticket=t2');
  });

  it('stops for good when the server says this person may not listen', async () => {
    const { fetchTicket } = setup();
    await settle();

    FakeWebSocket.instances[0].drop(4403);
    await vi.advanceTimersByTimeAsync(60_000);

    expect(fetchTicket).toHaveBeenCalledTimes(1);
  });

  it('closes and does not come back when the page is done with it', async () => {
    const { socket, fetchTicket } = setup();
    await settle();

    socket.close();
    FakeWebSocket.instances[0].drop(1006);
    await vi.advanceTimersByTimeAsync(60_000);

    expect(FakeWebSocket.instances[0].closed).toBe(true);
    expect(fetchTicket).toHaveBeenCalledTimes(1);
  });
});
