import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSessionSocketOpener } from './sessionSocket';

class FakeWebSocket {
  static instances: FakeWebSocket[] = [];
  onopen: (() => void) | null = null;
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
  const open = createSessionSocketOpener({
    fetchTicket,
    createWebSocket: (url) => new FakeWebSocket(url) as unknown as WebSocket,
    baseUrl: 'ws://api.test',
  });
  const onStatus = vi.fn();
  const socket = open('7', { onStatus });
  return { fetchTicket, onStatus, socket };
}

const settle = () => vi.advanceTimersByTimeAsync(0);

describe('session socket', () => {
  beforeEach(() => {
    FakeWebSocket.instances = [];
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  it('connects with a ticket and reports the status the server sends', async () => {
    const { onStatus } = setup();
    await settle();
    const ws = FakeWebSocket.instances[0];
    expect(ws.url).toBe('ws://api.test/ws/sessions/7/?ticket=t1');

    ws.say({ type: 'session.status', session: 7, status: 'ASSIGNED' });
    expect(onStatus).toHaveBeenCalledWith('ACCEPTED');
  });

  it('ignores messages that are not status updates', async () => {
    const { onStatus } = setup();
    await settle();
    FakeWebSocket.instances[0].say({ type: 'call.something', status: 'ASSIGNED' });
    FakeWebSocket.instances[0].onmessage?.({ data: 'not json' });
    expect(onStatus).not.toHaveBeenCalled();
  });

  it('gets a new ticket and reconnects after the ticket was refused (4401)', async () => {
    const fetchTicket = vi
      .fn()
      .mockResolvedValueOnce({ ticket: 't1' })
      .mockResolvedValueOnce({ ticket: 't2' });
    setup(fetchTicket);
    await settle();
    FakeWebSocket.instances[0].drop(4401);

    await vi.advanceTimersByTimeAsync(1000);
    expect(fetchTicket).toHaveBeenCalledTimes(2);
    expect(FakeWebSocket.instances[1].url).toContain('ticket=t2');
  });

  it('keeps trying when the ticket cannot be fetched', async () => {
    const fetchTicket = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ ticket: 't2' });
    setup(fetchTicket);
    await settle();
    expect(FakeWebSocket.instances).toHaveLength(0);

    await vi.advanceTimersByTimeAsync(1000);
    expect(FakeWebSocket.instances).toHaveLength(1);
  });

  it('does not reconnect when the person may not follow this session (4403)', async () => {
    const { fetchTicket } = setup();
    await settle();
    FakeWebSocket.instances[0].drop(4403);
    await vi.advanceTimersByTimeAsync(60000);
    expect(fetchTicket).toHaveBeenCalledTimes(1);
  });

  it('stops listening once the session is over', async () => {
    const { onStatus, fetchTicket } = setup();
    await settle();
    const ws = FakeWebSocket.instances[0];
    ws.say({ type: 'session.status', status: 'COMPLETED' });
    expect(onStatus).toHaveBeenCalledWith('COMPLETED');
    expect(ws.closed).toBe(true);

    ws.drop(1000);
    await vi.advanceTimersByTimeAsync(60000);
    expect(fetchTicket).toHaveBeenCalledTimes(1);
  });

  it('close() shuts the connection and stops any retry', async () => {
    const { socket, fetchTicket } = setup();
    await settle();
    const ws = FakeWebSocket.instances[0];
    socket.close();
    expect(ws.closed).toBe(true);

    ws.drop(1006);
    await vi.advanceTimersByTimeAsync(60000);
    expect(fetchTicket).toHaveBeenCalledTimes(1);
  });
});
