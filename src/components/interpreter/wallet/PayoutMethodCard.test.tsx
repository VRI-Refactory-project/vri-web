import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PayoutMethodCard } from './PayoutMethodCard';

describe('PayoutMethodCard', () => {
  it('shows the provider, a verified badge and only the last four digits', () => {
    render(
      <PayoutMethodCard
        method={{ provider: 'Mobile Money (Airtel Money)', lastDigits: '4821', verified: true }}
      />,
    );

    expect(screen.getByText('Mobile Money (Airtel Money)')).toBeInTheDocument();
    expect(screen.getByText('Verified')).toBeInTheDocument();
    expect(screen.getByLabelText('Account ending 4821')).toHaveTextContent('•••• 4821');
  });

  it('leaves out the badge when the method is not verified', () => {
    render(
      <PayoutMethodCard
        method={{ provider: 'Mobile Money (MTN)', lastDigits: '1234', verified: false }}
      />,
    );

    expect(screen.queryByText('Verified')).not.toBeInTheDocument();
  });

  it('says when no payout method has been added', () => {
    render(<PayoutMethodCard method={null} />);

    expect(screen.getByText('No payout method added yet')).toBeInTheDocument();
  });
});
