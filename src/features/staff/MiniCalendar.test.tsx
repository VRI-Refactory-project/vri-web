import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { HistoryItem } from '../../services/mySessions';
import { dayKey, monthGrid } from './calendarDays';
import { MiniCalendar } from './MiniCalendar';

const today = new Date(2026, 10, 13, 9, 0); // 13 Nov 2026

const item = (id: string, iso: string): HistoryItem => ({
  id,
  status: 'completed',
  interpreterName: 'Grace Nakato',
  emergency: false,
  createdAt: iso,
});

const renderCalendar = (items: HistoryItem[]) =>
  render(
    <MemoryRouter>
      <MiniCalendar items={items} detailsBase="/dashboard/staff/sessions" today={today} />
    </MemoryRouter>,
  );

describe('monthGrid', () => {
  it('covers six Monday-first weeks around the month', () => {
    const cells = monthGrid(2026, 10); // November 2026 starts on a Sunday
    expect(cells).toHaveLength(42);
    expect(cells[0].getDay()).toBe(1);
    expect(dayKey(cells[0])).toBe('2026-10-26');
    expect(cells.some((d) => dayKey(d) === '2026-11-30')).toBe(true);
  });
});

describe('MiniCalendar', () => {
  it('shows the current month and marks today', () => {
    renderCalendar([]);
    expect(screen.getByText('November 2026')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Friday,? 13 November 2026/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByText('No sessions this day.')).toBeInTheDocument();
  });

  it('marks days that have sessions and lists them when picked', async () => {
    renderCalendar([item('5', new Date(2026, 10, 11, 14, 30).toISOString())]);
    const day = screen.getByRole('button', {
      name: /11 November 2026, 1 session/,
    });
    await userEvent.click(day);
    const link = within(screen.getByRole('region', { name: 'Calendar' })).getByRole('link');
    expect(link).toHaveAttribute('href', '/dashboard/staff/sessions/5');
  });

  it('moves between months and back to today', async () => {
    renderCalendar([]);
    await userEvent.click(screen.getByRole('button', { name: 'Next month' }));
    expect(screen.getByText('December 2026')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Previous month' }));
    await userEvent.click(screen.getByRole('button', { name: 'Previous month' }));
    expect(screen.getByText('October 2026')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Today' }));
    expect(screen.getByText('November 2026')).toBeInTheDocument();
  });
});
