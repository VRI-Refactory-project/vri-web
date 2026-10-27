import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getInterpreterWallet,
  type InterpreterTransaction,
  type InterpreterWallet,
} from '../../services/interpreterWallet';
import { InterpreterWalletPage } from './WalletPage';

// Keep the real helpers (date formatting); only the data source is replaced.
vi.mock('../../services/interpreterWallet', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../services/interpreterWallet')>()),
  getInterpreterWallet: vi.fn(),
}));

const WALLET: InterpreterWallet = {
  available: 27000,
  pending: 17000,
  total: 44000,
  payoutMethod: null,
  transactions: [],
};

const ACTIVITY: InterpreterTransaction[] = [
  {
    id: '1',
    title: 'Session payment',
    detail: 'Client: Acme Corp',
    date: '2026-10-10',
    amount: 120,
    kind: 'earning',
    status: 'Completed',
    icon: 'session',
  },
  {
    id: '2',
    title: 'Pending session payment',
    detail: 'Client: Global Health Org',
    date: '2026-10-09',
    amount: 85,
    kind: 'pending',
    status: 'Pending',
    icon: 'pending',
  },
  {
    id: '3',
    title: 'Withdrawal',
    detail: 'Mobile Money (**** 4821)',
    date: '2026-10-07',
    amount: -200,
    kind: 'withdrawal',
    status: 'Processing',
    icon: 'withdrawal',
  },
];

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/dashboard/interpreter/wallet']}>
      <Routes>
        <Route path="/dashboard/interpreter/wallet" element={<InterpreterWalletPage />} />
        <Route path="/dashboard/interpreter" element={<p>interpreter home</p>} />
      </Routes>
    </MemoryRouter>,
  );

describe('InterpreterWalletPage', () => {
  beforeEach(() => {
    vi.mocked(getInterpreterWallet).mockReset();
  });

  it('shows the heading and goes back to the dashboard home', async () => {
    vi.mocked(getInterpreterWallet).mockResolvedValue(WALLET);
    renderPage();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Interpreter Wallet' }),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(screen.getByText('interpreter home')).toBeInTheDocument();
  });

  it('shows the three totals', async () => {
    vi.mocked(getInterpreterWallet).mockResolvedValue(WALLET);
    renderPage();

    expect(await screen.findByText('$ 27,000')).toBeInTheDocument();
    expect(screen.getByText('$ 17,000')).toBeInTheDocument();
    expect(screen.getByText('$ 44,000')).toBeInTheDocument();
    expect(screen.getByText('Available Balance')).toBeInTheDocument();
    expect(screen.getByText('Pending Earnings')).toBeInTheDocument();
    expect(screen.getByText('Total Earnings')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('lists recent activity', async () => {
    vi.mocked(getInterpreterWallet).mockResolvedValue({ ...WALLET, transactions: ACTIVITY });
    renderPage();

    const activity = screen.getByRole('region', { name: 'Recent Activity' });
    expect(await within(activity).findAllByRole('listitem')).toHaveLength(3);
    expect(within(activity).getByText('Session payment')).toBeInTheDocument();
    expect(within(activity).getByText('- $200.00')).toBeInTheDocument();
  });

  it('shows only the chosen kind of transaction', async () => {
    vi.mocked(getInterpreterWallet).mockResolvedValue({ ...WALLET, transactions: ACTIVITY });
    renderPage();
    await screen.findByText('Session payment');

    await userEvent.click(screen.getByRole('button', { name: 'Withdrawals' }));

    expect(screen.getByRole('button', { name: 'Withdrawals' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByText('Withdrawal')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'All' }));
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('searches titles and details', async () => {
    vi.mocked(getInterpreterWallet).mockResolvedValue({ ...WALLET, transactions: ACTIVITY });
    renderPage();
    await screen.findByText('Session payment');

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search transactions' }), 'global');

    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByText('Pending session payment')).toBeInTheDocument();
  });

  it('says when nothing matches, instead of claiming there is no history', async () => {
    vi.mocked(getInterpreterWallet).mockResolvedValue({ ...WALLET, transactions: ACTIVITY });
    renderPage();
    await screen.findByText('Session payment');

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search transactions' }), 'zzz');

    expect(screen.getByText('No transactions match your filter.')).toBeInTheDocument();
    expect(screen.queryByText('No transactions yet.')).not.toBeInTheDocument();
  });

  it('says when there is no activity yet', async () => {
    vi.mocked(getInterpreterWallet).mockResolvedValue(WALLET);
    renderPage();

    expect(await screen.findByText('No transactions yet.')).toBeInTheDocument();
  });

  it('says plainly when payments are not live, without inventing amounts', async () => {
    vi.mocked(getInterpreterWallet).mockResolvedValue(null);
    renderPage();

    expect(await screen.findByRole('status')).toHaveTextContent('Payments are not live yet.');
    expect(screen.getAllByText('—')).toHaveLength(3);
  });
});
