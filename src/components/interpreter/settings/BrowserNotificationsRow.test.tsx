import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BrowserNotificationsRow } from './BrowserNotificationsRow';
import * as webPush from '../../../services/webPush';

vi.mock('../../../services/webPush', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../services/webPush')>()),
  webPushSupported: vi.fn(),
  getWebPushKey: vi.fn(),
  syncWebPush: vi.fn(),
  enableWebPush: vi.fn(),
  disableWebPush: vi.fn(),
}));

const mocked = vi.mocked(webPush);

beforeEach(() => {
  mocked.webPushSupported.mockReturnValue(true);
  mocked.getWebPushKey.mockResolvedValue('server-key');
  mocked.syncWebPush.mockResolvedValue(false);
  mocked.enableWebPush.mockResolvedValue(undefined);
  mocked.disableWebPush.mockResolvedValue(undefined);
});
afterEach(() => vi.resetAllMocks());

describe('BrowserNotificationsRow', () => {
  it('shows nothing when the browser cannot do it', async () => {
    mocked.webPushSupported.mockReturnValue(false);
    const { container } = render(<BrowserNotificationsRow />);

    await Promise.resolve();
    expect(container).toBeEmptyDOMElement();
  });

  it('shows nothing when the server has it switched off', async () => {
    mocked.getWebPushKey.mockResolvedValue('');
    const { container } = render(<BrowserNotificationsRow />);

    await Promise.resolve();
    expect(container).toBeEmptyDOMElement();
  });

  it('turns notifications on with the server key', async () => {
    render(<BrowserNotificationsRow />);
    const toggle = await screen.findByRole('switch', { name: 'Browser notifications' });
    expect(toggle).toHaveAttribute('aria-checked', 'false');

    await userEvent.click(toggle);

    expect(mocked.enableWebPush).toHaveBeenCalledWith('server-key');
    expect(await screen.findByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('starts on when this browser already has notifications on, and can turn them off', async () => {
    mocked.syncWebPush.mockResolvedValue(true);
    render(<BrowserNotificationsRow />);
    const toggle = await screen.findByRole('switch', { name: 'Browser notifications' });
    expect(toggle).toHaveAttribute('aria-checked', 'true');

    await userEvent.click(toggle);

    expect(mocked.disableWebPush).toHaveBeenCalled();
    expect(await screen.findByRole('switch')).toHaveAttribute('aria-checked', 'false');
  });

  it('explains what to do when the browser blocks notifications', async () => {
    mocked.enableWebPush.mockRejectedValue(new webPush.WebPushBlocked());
    render(<BrowserNotificationsRow />);

    await userEvent.click(await screen.findByRole('switch'));

    expect(await screen.findByRole('alert')).toHaveTextContent(/blocked for this site/i);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  });
});
