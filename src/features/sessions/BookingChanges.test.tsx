import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../services/api';
import { BookingChanges } from './BookingChanges';
import { cancelBooking, rescheduleBooking, type MyBooking } from './myBookings';

vi.mock('./myBookings', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./myBookings')>();
  return { ...actual, cancelBooking: vi.fn(), rescheduleBooking: vi.fn() };
});

const booking = (over: Partial<MyBooking> = {}): MyBooking => ({
  id: 9,
  date: '2026-12-04',
  time: '10:00:00',
  duration: 45,
  session_type: 'medical',
  status: 'CONFIRMED',
  interpreter_name: 'Moses Okello',
  can_change: true,
  change_deadline: '2026-12-03T10:00:00+03:00',
  change_notice_hours: 24,
  ...over,
});

const show = (b = booking(), onChanged = vi.fn()) => {
  render(<BookingChanges booking={b} onChanged={onChanged} />);
  return onChanged;
};

beforeEach(() => {
  vi.mocked(cancelBooking).mockReset();
  vi.mocked(rescheduleBooking).mockReset();
});

describe('BookingChanges (V2-051)', () => {
  it('shows the notice rule and deadline before cancelling', async () => {
    const user = userEvent.setup();
    vi.mocked(cancelBooking).mockResolvedValue(booking({ status: 'CANCELLED' }));
    const onChanged = show();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    const dialog = screen.getByRole('dialog', { name: 'Cancel this booking?' });
    expect(dialog).toHaveTextContent(
      'Bookings can be cancelled or changed up to 24 hours before they start.',
    );
    expect(dialog).toHaveTextContent('You can cancel or change this booking until');
    expect(dialog).toHaveTextContent('Moses Okello will be told it is cancelled.');

    await user.click(screen.getByRole('button', { name: 'Cancel booking' }));
    expect(cancelBooking).toHaveBeenCalledWith(9);
    expect(onChanged).toHaveBeenCalledWith(expect.objectContaining({ status: 'CANCELLED' }));
  });

  it('keeping the booking sends nothing', async () => {
    const user = userEvent.setup();
    show();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await user.click(screen.getByRole('button', { name: 'Keep booking' }));

    expect(cancelBooking).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('moves a booking to a new date and time', async () => {
    const user = userEvent.setup();
    const moved = booking({ date: '2026-12-08', time: '14:30:00' });
    vi.mocked(rescheduleBooking).mockResolvedValue(moved);
    const onChanged = show();

    await user.click(screen.getByRole('button', { name: 'Reschedule' }));
    const dialog = screen.getByRole('dialog', { name: 'Reschedule booking' });
    expect(dialog).toHaveTextContent('up to 24 hours before they start');
    expect(screen.getByRole('button', { name: 'Move booking' })).toBeDisabled(); // nothing changed yet

    const date = screen.getByLabelText('New date');
    await user.clear(date);
    await user.type(date, '2026-12-08');
    const time = screen.getByLabelText('New time');
    await user.clear(time);
    await user.type(time, '14:30');
    await user.click(screen.getByRole('button', { name: 'Move booking' }));

    expect(rescheduleBooking).toHaveBeenCalledWith(9, {
      date: '2026-12-08',
      time: '14:30',
      duration: 45,
    });
    expect(onChanged).toHaveBeenCalledWith(moved);
  });

  it('shows what the server says when a move is refused', async () => {
    const user = userEvent.setup();
    vi.mocked(rescheduleBooking).mockImplementation(() =>
      Promise.reject(new ApiError(400, 'You already have a session booked at that time.')),
    );
    show();

    await user.click(screen.getByRole('button', { name: 'Reschedule' }));
    await user.selectOptions(screen.getByLabelText('Length'), '60');
    await user.click(screen.getByRole('button', { name: 'Move booking' }));

    expect(
      await screen.findByText('You already have a session booked at that time.'),
    ).toHaveAttribute('role', 'alert');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('inside the notice window there are no buttons, only why', () => {
    show(booking({ can_change: false }));

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('Too late to change')).toHaveAttribute(
      'title',
      expect.stringContaining('starts too soon to be cancelled or changed'),
    );
  });
});
