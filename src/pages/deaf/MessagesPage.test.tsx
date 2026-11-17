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
  sendSticker: vi.fn(),
  sendPhoto: vi.fn(),
  getMessageImage: vi.fn(),
  markRead: vi.fn(),
}));
vi.mock('../../services/community', () => svc);

const person = (id: number, name: string) => ({ id, name, location: 'Kampala', photoUrl: null });
const message = (id: number, body: string, mine: boolean, read = false): ChatMessage => ({
  id,
  body,
  sticker: '',
  imageUrl: null,
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

const picture = (name = 'sunset.jpg', type = 'image/jpeg') => new File(['pixels'], name, { type });

beforeEach(() => {
  vi.clearAllMocks();
  URL.createObjectURL = vi.fn(() => 'blob:preview');
  URL.revokeObjectURL = vi.fn();
  svc.getMessageImage.mockResolvedValue('blob:photo');
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

  it('sends a sticker from the picker and shows it large', async () => {
    svc.sendSticker.mockResolvedValue({ ...message(5, '', true), sticker: 'thumbs_up' });
    renderPage();
    await screen.findByText('Hi Irene');
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Stickers' }));
    await user.click(screen.getByRole('button', { name: 'Thumbs up' }));

    expect(svc.sendSticker).toHaveBeenCalledWith(1, 'thumbs_up');
    expect(await screen.findByRole('img', { name: 'Thumbs up' })).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Choose a sticker' })).not.toBeInTheDocument();
  });

  it('closes the sticker panel with Escape', async () => {
    renderPage();
    await screen.findByText('Hi Irene');
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Stickers' }));
    expect(screen.getByRole('group', { name: 'Choose a sticker' })).toBeInTheDocument();
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('group', { name: 'Choose a sticker' })).not.toBeInTheDocument();
  });

  it('shows a received sticker, and the word Sticker in the conversation list', async () => {
    svc.getConversations.mockResolvedValue([
      { ...sarah, lastMessage: { ...message(9, '', false), sticker: 'heart' } },
    ]);
    svc.getMessages.mockResolvedValue({
      messages: [{ ...message(9, '', false), sticker: 'heart' }],
      hasMore: false,
    });
    renderPage();

    expect(await screen.findByRole('img', { name: 'Heart' })).toBeInTheDocument();
    expect(screen.getByText('Sticker')).toBeInTheDocument();
  });

  it('shows a plain face for a sticker this version does not know', async () => {
    svc.getMessages.mockResolvedValue({
      messages: [{ ...message(9, '', false), sticker: 'brand_new' }],
      hasMore: false,
    });
    renderPage();

    expect(await screen.findByRole('img', { name: 'Sticker' })).toBeInTheDocument();
  });

  it('shows a chosen photo before sending, then sends it with the caption', async () => {
    const sent = { ...message(6, 'Sunset', true), imageUrl: '/api/p/6/' };
    svc.sendPhoto.mockResolvedValue(sent);
    renderPage();
    await screen.findByText('Hi Irene');
    const user = userEvent.setup();

    const file = picture();
    await user.upload(screen.getByTestId('gallery-input'), file);
    expect(screen.getByAltText('Photo ready to send')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Add a caption'), 'Sunset');
    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(svc.sendPhoto).toHaveBeenCalledWith(1, file, 'Sunset');
    expect(await screen.findByRole('img', { name: 'Sunset' })).toHaveAttribute('src', 'blob:photo');
    expect(screen.queryByAltText('Photo ready to send')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Write a message')).toHaveValue('');
  });

  it('can send a photo with no caption, and the camera button works the same way', async () => {
    svc.sendPhoto.mockResolvedValue({ ...message(7, '', true), imageUrl: '/api/p/7/' });
    renderPage();
    await screen.findByText('Hi Irene');
    const user = userEvent.setup();

    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
    const file = picture('camera.jpg');
    await user.upload(screen.getByTestId('camera-input'), file);
    expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(svc.sendPhoto).toHaveBeenCalledWith(1, file, '');
    expect(await screen.findByRole('img', { name: 'Photo' })).toBeInTheDocument();
  });

  it('lets you take a photo back before sending', async () => {
    renderPage();
    await screen.findByText('Hi Irene');
    const user = userEvent.setup();

    await user.upload(screen.getByTestId('gallery-input'), picture());
    await user.click(screen.getByRole('button', { name: 'Remove photo' }));

    expect(screen.queryByAltText('Photo ready to send')).not.toBeInTheDocument();
    expect(svc.sendPhoto).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
  });

  it('refuses a file that is not a picture, and one that is too big', async () => {
    renderPage();
    await screen.findByText('Hi Irene');
    const user = userEvent.setup({ applyAccept: false });

    await user.upload(screen.getByTestId('gallery-input'), picture('notes.pdf', 'application/pdf'));
    expect(await screen.findByRole('alert')).toHaveTextContent(/Choose a picture/);

    const big = picture('big.jpg');
    Object.defineProperty(big, 'size', { value: 9 * 1024 * 1024 });
    await user.upload(screen.getByTestId('gallery-input'), big);
    expect(await screen.findByRole('alert')).toHaveTextContent(/under 8 MB/);
    expect(screen.queryByAltText('Photo ready to send')).not.toBeInTheDocument();
  });

  it('shows the reason when a photo is refused by the server', async () => {
    svc.sendPhoto.mockRejectedValue(new Error('x'));
    renderPage();
    await screen.findByText('Hi Irene');
    const user = userEvent.setup();

    await user.upload(screen.getByTestId('gallery-input'), picture());
    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByAltText('Photo ready to send')).toBeInTheDocument();
  });

  it('shows a received photo with its caption, and Photo in the conversation list', async () => {
    const photo = { ...message(9, '', false), imageUrl: '/api/p/9/' };
    svc.getConversations.mockResolvedValue([{ ...sarah, lastMessage: photo }]);
    svc.getMessages.mockResolvedValue({
      messages: [photo, { ...message(10, 'from the lake', false), imageUrl: '/api/p/10/' }],
      hasMore: false,
    });
    renderPage();

    expect(await screen.findByRole('img', { name: 'from the lake' })).toBeInTheDocument();
    expect(screen.getAllByText('from the lake').length).toBeGreaterThan(0);
    expect(svc.getMessageImage).toHaveBeenCalledWith('/api/p/9/');
    expect(screen.getByText('Photo')).toBeInTheDocument();
  });

  it('says so when a photo cannot be loaded', async () => {
    svc.getMessageImage.mockRejectedValue(new Error('gone'));
    svc.getMessages.mockResolvedValue({
      messages: [{ ...message(9, '', false), imageUrl: '/api/p/9/' }],
      hasMore: false,
    });
    renderPage();

    expect(await screen.findByText('This photo could not be loaded.')).toBeInTheDocument();
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
