import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { InterpreterTransaction } from '../../../services/interpreterWallet';
import { TransactionRow } from './TransactionRow';

const renderRow = (overrides: Partial<InterpreterTransaction> = {}) =>
  render(
    <ul>
      <TransactionRow
        transaction={{
          id: '1',
          title: 'Session payment',
          detail: 'Client: Acme Corp',
          date: '2026-10-10',
          amount: 120,
          kind: 'earning',
          status: 'Completed',
          icon: 'session',
          ...overrides,
        }}
      />
    </ul>,
  );

describe('TransactionRow', () => {
  it('shows what it was, when and for whom', () => {
    renderRow();

    expect(screen.getByText('Session payment')).toBeInTheDocument();
    expect(screen.getByText(/Oct 10, 2026/)).toHaveTextContent('Oct 10, 2026 • Client: Acme Corp');
  });

  it('shows money in as a green plus amount', () => {
    renderRow();

    const amount = screen.getByText('+ $120.00');
    expect(amount).not.toHaveClass('iw-amount--out');
  });

  it('shows money out as a red minus amount', () => {
    renderRow({ title: 'Withdrawal', amount: -200, kind: 'withdrawal', status: 'Processing' });

    expect(screen.getByText('- $200.00')).toHaveClass('iw-amount--out');
  });

  it('shows the status as a coloured badge', () => {
    renderRow({ status: 'Pending' });

    expect(screen.getByText('Pending')).toHaveClass('iw-badge', 'iw-badge--pending');
  });
});
