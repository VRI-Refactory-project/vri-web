import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getIncomingOffers, type IncomingOffer } from '../../services/interpreterOffers';
import { IncomingRequestModal } from './IncomingRequestModal';

vi.mock('../../services/interpreterOffers', () => ({ getIncomingOffers: vi.fn() }));

const offer = (over: Partial<IncomingOffer> = {}): IncomingOffer => ({
  id: 7,
  context: 'MEDICAL',
  description: 'Clinic visit',
  priority: 'NORMAL',
  requesterName: 'Maria Theresa',
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
    expect(screen.getByRole('timer')).toHaveTextContent(/Respond within 0:\d\d/);
  });

  it('marks an emergency', async () => {
    vi.mocked(getIncomingOffers).mockResolvedValue([offer({ priority: 'EMERGENCY' })]);
    render(<IncomingRequestModal pollMs={10} />);

    expect(await screen.findByRole('heading', { name: 'Emergency request' })).toBeInTheDocument();
  });

  it('stays closed after it is dismissed, even though the server still lists it', async () => {
    vi.mocked(getIncomingOffers).mockResolvedValue([offer()]);
    render(<IncomingRequestModal pollMs={10} />);
    await screen.findByRole('dialog');

    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    await wait(60);

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('keeps working when a check fails', async () => {
    vi.mocked(getIncomingOffers)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue([offer()]);
    render(<IncomingRequestModal pollMs={10} />);

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });
});
