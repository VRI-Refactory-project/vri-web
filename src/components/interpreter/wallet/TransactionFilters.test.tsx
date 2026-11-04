import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TransactionFilters } from './TransactionFilters';

const renderFilters = (props: Partial<Parameters<typeof TransactionFilters>[0]> = {}) =>
  render(
    <TransactionFilters
      filter="all"
      onFilterChange={vi.fn()}
      search=""
      onSearchChange={vi.fn()}
      {...props}
    />,
  );

describe('TransactionFilters', () => {
  it('marks the chosen chip as pressed', () => {
    renderFilters({ filter: 'withdrawals' });

    expect(screen.getByRole('button', { name: 'Withdrawals' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('reports a chip being chosen', async () => {
    const onFilterChange = vi.fn();
    renderFilters({ onFilterChange });

    await userEvent.click(screen.getByRole('button', { name: 'Pending' }));

    expect(onFilterChange).toHaveBeenCalledWith('pending');
  });

  it('reports what is typed in the search box', async () => {
    const onSearchChange = vi.fn();
    renderFilters({ onSearchChange });

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search transactions' }), 'A');

    expect(onSearchChange).toHaveBeenCalledWith('A');
  });
});
