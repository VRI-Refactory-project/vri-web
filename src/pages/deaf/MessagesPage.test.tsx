import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChatMessage, Conversation } from '../../services/community';
import { MessagesPage } from './MessagesPage';

const svc = vi.hoisted(() => ({
  getConversations: vi.fn(),
  getMessages: vi.fn(),
  sendMessage: vi.fn(),
  markRead: vi.fn(),
}));
vi.mock('../../services/community', () => svc);

const person = (id: number, name: string) => ({ id, name, location: 'Kampala', photoUrl: null });
const message = (id: number, body: string, mine: boolean, read = false): ChatMessage => ({
  id,
  body,
  createdAt: new Date().toISOString(),
  mine,
  read,
});

const sarah: Conversation = {
  id: 1,
  person: person(10, 'Sarah Nsubuga'),
  lastMessage: message(2, 'Let’s meet later', false),
  unread: 1,
};
const daniel: Conversation = {
  id: 2,
  person: person(11, 'Daniel Ochieng'),
  lastMessage: null,
  unread: 0,
};

const renderPage = (url = '/dashboard/deaf/messages') =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <MessagesPage />
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  svc.getConversations.mockResolvedValue([sarah, daniel]);
  svc.getMessages.mockResolvedValue({
    messages: [message(1, 'Hi Irene', false), message(3, 'Hi Sarah', true, true)],
    hasMore: false,
  });
  svc.markRead.mockResolvedValue(undefined);
});
afterEach(cleanup);

describe('MessagesPage', () => {
  it('lists conversations and opens the first with its messages', async () => {
    renderPage();

    expect(await screen.findByText('Hi Irene')).toBeInTheDocument();
    expect(svc.getMessages).toHaveBeenCalledWith(1);
    expect(screen.getByText('Say hello')).toBeInTheDocument();
    expect(screen.getByLabelText('Read')).toBeInTheDocument();
  });

  it('reads the unread messages of the open conversation and clears the badge', async () => {
    let finish: () => void = () => undefined;
    svc.markRead.mockReturnValue(new Promise<void>((resolve) => (finish = resolve)));
    renderPage();

    expect(await screen.findByLabelText('1 unread')).toBeInTheDocument();
    await waitFor(() => expect(svc.markRead).toHaveBeenCalledWith(1));
    finish();
    await waitFor(() => expect(screen.queryByLabelText('1 unread')).not.toBeInTheDocument());
  });

  it('opens the conversation named in the address', async () => {
    renderPage('/dashboard/deaf/messages?c=2');

    await waitFor(() => expect(svc.getMessages).toHaveBeenCalledWith(2));
    const head = await screen.findByRole('region', { name: 'Conversation' });
    expect(within(head).getByText('Daniel Ochieng')).toBeInTheDocument();
  });

  it('switches conversation when one is picked', async () => {
    renderPage();
    await screen.findByText('Hi Irene');

    await userEvent.click(screen.getByRole('button', { name: /Daniel Ochieng/ }));

    await waitFor(() => expect(svc.getMessages).toHaveBeenCalledWith(2));
  });

  it('sends a message, shows it, and clears the box', async () => {
    svc.sendMessage.mockResolvedValue(message(4, 'See you at 4', true));
    renderPage();
    await screen.findByText('Hi Irene');
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Write a message'), '  See you at 4 ');
    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(svc.sendMessage).toHaveBeenCalledWith(1, 'See you at 4');
    expect(await screen.findByText('See you at 4')).toBeInTheDocument();
    expect(screen.getByLabelText('Write a message')).toHaveValue('');
  });

  it('cannot send an empty message', async () => {
    renderPage();
    await screen.findByText('Hi Irene');

    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
  });

  it('keeps the draft and says so when sending fails', async () => {
    svc.sendMessage.mockRejectedValue(new Error('offline'));
    renderPage();
    await screen.findByText('Hi Irene');
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Write a message'), 'Hello');
    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByLabelText('Write a message')).toHaveValue('Hello');
  });

  it('loads earlier messages when there are more', async () => {
    svc.getMessages
      .mockResolvedValueOnce({ messages: [message(5, 'newer', false)], hasMore: true })
      .mockResolvedValueOnce({ messages: [message(2, 'older', false)], hasMore: false });
    renderPage();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Load earlier messages' }));

    expect(svc.getMessages).toHaveBeenLastCalledWith(1, 5);
    expect(await screen.findByText('older')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Load earlier messages' })).not.toBeInTheDocument();
  });

  it('searches conversations by name', async () => {
    renderPage();
    await screen.findByText('Hi Irene');

    await userEvent.type(screen.getByLabelText('Search conversations'), 'dan');

    expect(screen.queryByRole('button', { name: /Sarah Nsubuga/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Daniel Ochieng/ })).toBeInTheDocument();
  });

  it('points to Community when there are no conversations yet', async () => {
    svc.getConversations.mockResolvedValue([]);
    renderPage();

    const link = await screen.findByRole('link', { name: 'Find people in Community' });
    expect(link).toHaveAttribute('href', '/dashboard/deaf/messages/community');
  });

  it('says so when the conversations cannot be loaded', async () => {
    svc.getConversations.mockRejectedValue(new Error('down'));
    renderPage();

    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });
});
