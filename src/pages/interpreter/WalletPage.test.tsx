import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getInterpreterWallet, type InterpreterWallet } from '../../services/interpreterWallet';
import { InterpreterWalletPage } from './WalletPage';

vi.mock('../../services/interpreterWallet', () => ({
  getInterpreterWallet: vi.fn(),
}));

const WALLET: InterpreterWallet = {
  available: 27000,
  pending: 17000,
  total: 44000,
  payoutMethod: null,
  transactions: [],
};

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

  it('says plainly when payments are not live, without inventing amounts', async () => {
    vi.mocked(getInterpreterWallet).mockResolvedValue(null);
    renderPage();

    expect(await screen.findByRole('status')).toHaveTextContent('Payments are not live yet.');
    expect(screen.getAllByText('—')).toHaveLength(3);
  });
});
