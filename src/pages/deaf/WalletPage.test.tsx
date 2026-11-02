import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WalletPage } from './WalletPage';

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe('WalletPage', () => {
  it('says payments are not live and shows no made-up figures', async () => {
    render(<WalletPage />);
    expect(await screen.findByText(/Payments are not live yet/)).toBeTruthy();
    expect(screen.getByText('No transactions yet.')).toBeTruthy();
    expect(screen.queryByText(/\$ 27,000/)).toBeNull();
  });

  it('shows balances and filters transactions when sample data is on', async () => {
    vi.stubEnv('VITE_MOCK_DEAF_EXTRAS', 'true');
    render(<WalletPage />);
    expect(await screen.findByText('$ 27,000')).toBeTruthy();
    expect(screen.getByText('Session payment')).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: 'Withdrawals' }));
    expect(screen.queryByText('Session payment')).toBeNull();
    expect(screen.getByText('Withdrawal')).toBeTruthy();
  });
});
