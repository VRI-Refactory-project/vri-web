import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLiveSessionsSocketOpener } from './liveSessionsSocket';

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

function setup() {
  const fetchTicket = vi.fn().mockResolvedValue({ ticket: 't1' });
  const open = createLiveSessionsSocketOpener({
    fetchTicket,
    createWebSocket: (url) => new FakeWebSocket(url) as unknown as WebSocket,
    baseUrl: 'ws://api.test',
  });
  const events = { onSession: vi.fn(), onConnectionChange: vi.fn() };
  const socket = open(events);
  return { fetchTicket, events, socket };
}

const settle = () => vi.advanceTimersByTimeAsync(0);

describe('live sessions socket (V2-047)', () => {
  beforeEach(() => {
    FakeWebSocket.instances = [];
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  it('connects with a ticket and reports when it is ready', async () => {
    const { events } = setup();
    await settle();
    const ws = FakeWebSocket.instances[0];
    expect(ws.url).toBe('ws://api.test/ws/admin/sessions/?ticket=t1');

    ws.say({ type: 'live_sessions.ready' });
    expect(events.onConnectionChange).toHaveBeenCalledWith(true);
  });

  it('passes on session updates and ignores anything else', async () => {
    const { events } = setup();
    await settle();
    const ws = FakeWebSocket.instances[0];

    ws.say({ type: 'live_session.updated', session: { id: 4 } });
    ws.say({ type: 'something.else' });
    ws.onmessage?.({ data: 'not json' });

    expect(events.onSession).toHaveBeenCalledTimes(1);
    expect(events.onSession).toHaveBeenCalledWith({ id: 4 });
  });

  it('reconnects with a new ticket when the connection drops', async () => {
    const { events, fetchTicket } = setup();
    await settle();

    FakeWebSocket.instances[0].drop(1006);
    expect(events.onConnectionChange).toHaveBeenCalledWith(false);
    await vi.advanceTimersByTimeAsync(1000);

    expect(fetchTicket).toHaveBeenCalledTimes(2);
    expect(FakeWebSocket.instances).toHaveLength(2);
  });

  it('stops trying when the server says the person may not watch', async () => {
    const { fetchTicket } = setup();
    await settle();

    FakeWebSocket.instances[0].drop(4403);
    await vi.advanceTimersByTimeAsync(60000);

    expect(fetchTicket).toHaveBeenCalledTimes(1);
  });

  it('closing stops everything', async () => {
    const { socket, events } = setup();
    await settle();

    socket.close();
    FakeWebSocket.instances[0].drop(1000);
    await vi.advanceTimersByTimeAsync(60000);

    expect(FakeWebSocket.instances[0].closed).toBe(true);
    expect(FakeWebSocket.instances).toHaveLength(1);
    expect(events.onConnectionChange).not.toHaveBeenCalled();
  });
});
