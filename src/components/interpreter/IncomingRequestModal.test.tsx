import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../services/api';
import {
  getIncomingOffers,
  respondToOffer,
  type IncomingOffer,
} from '../../services/interpreterOffers';
import { IncomingRequestModal } from './IncomingRequestModal';

vi.mock('../../services/interpreterOffers', () => ({
  getIncomingOffers: vi.fn(),
  respondToOffer: vi.fn(),
}));

const offer = (over: Partial<IncomingOffer> = {}): IncomingOffer => ({
  id: '7',
  title: 'Medical interpreting request',
  requesterName: 'Maria Theresa',
  sector: 'Medical',
  emergency: false,
  expiresAt: new Date(Date.now() + 60_000).toISOString(),
  ...over,
});

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('IncomingRequestModal', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('stays hidden when nothing is offered', async () => {
    vi.mocked(getIncomingOffers).mockResolvedValue([]);
    render(<IncomingRequestModal pollMs={10} />);
    await wait(40);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('shows who is asking, the context and a countdown', async () => {
    vi.mocked(getIncomingOffers).mockResolvedValue([offer()]);
    render(<IncomingRequestModal pollMs={10} />);

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Maria Theresa')).toBeInTheDocument();
    expect(screen.getByText(/Medical/)).toBeInTheDocument();
    expect(screen.getByRole('timer')).toHaveTextContent(/Respond within \d:\d\d/);
  });

  it('marks an emergency', async () => {
    vi.mocked(getIncomingOffers).mockResolvedValue([offer({ emergency: true })]);
    render(<IncomingRequestModal pollMs={10} />);

    expect(await screen.findByRole('heading', { name: 'Emergency request' })).toBeInTheDocument();
  });

  it('accepts the offer and stays on the page', async () => {
    vi.mocked(getIncomingOffers).mockResolvedValue([offer()]);
    vi.mocked(respondToOffer).mockResolvedValue();
    render(<IncomingRequestModal pollMs={10} />);
    await screen.findByRole('dialog');

    await userEvent.click(screen.getByRole('button', { name: 'Accept' }));

    expect(respondToOffer).toHaveBeenCalledWith('7', 'accept');
    expect(await screen.findByRole('heading', { name: 'Request accepted' })).toBeInTheDocument();
  });

  it('declines the offer, closes, and does not bring it back', async () => {
    vi.mocked(getIncomingOffers).mockResolvedValue([offer()]);
    vi.mocked(respondToOffer).mockResolvedValue();
    render(<IncomingRequestModal pollMs={10} />);
    await screen.findByRole('dialog');

    await userEvent.click(screen.getByRole('button', { name: 'Decline' }));
    await wait(60);

    expect(respondToOffer).toHaveBeenCalledWith('7', 'decline');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('shows the reason when the offer is no longer available', async () => {
    vi.mocked(getIncomingOffers).mockResolvedValue([offer()]);
    vi.mocked(respondToOffer).mockRejectedValue(new ApiError(409, 'This offer has expired.'));
    render(<IncomingRequestModal pollMs={10} />);
    await screen.findByRole('dialog');

    await userEvent.click(screen.getByRole('button', { name: 'Accept' }));

    expect(await screen.findByText('This offer has expired.')).toBeInTheDocument();
  });

  it('keeps working when a check fails', async () => {
    vi.mocked(getIncomingOffers)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue([offer()]);
    render(<IncomingRequestModal pollMs={10} />);

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });
});
