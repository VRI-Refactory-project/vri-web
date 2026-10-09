import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AuthShell } from './AuthShell';

const renderShell = (props: Partial<Parameters<typeof AuthShell>[0]> = {}) =>
  render(
    <MemoryRouter>
      <AuthShell {...props}>
        <p>content</p>
      </AuthShell>
    </MemoryRouter>,
  );

describe('AuthShell', () => {
  it('always shows the logo as a link to the home page', () => {
    renderShell();
    expect(screen.getByRole('link', { name: 'SignConnect' })).toHaveAttribute('href', '/');
  });

  it('lists the named steps and marks the current one', () => {
    renderShell({ steps: ['Choose your role', 'Create your account'], current: 2 });
    expect(screen.getAllByText('Choose your role').length).toBeGreaterThan(0);
    expect(screen.getByRole('listitem', { current: 'step' })).toHaveTextContent(
      'Create your account',
    );
    expect(screen.getByText('Step 2 of 2: Create your account')).toBeInTheDocument();
  });

  it('shows no steps when none are given', () => {
    renderShell();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.queryByText(/Step \d of \d/)).not.toBeInTheDocument();
  });

  it('renders Back as a link when given a path and as a button when given a handler', () => {
    const { unmount } = renderShell({ backTo: '/get-started' });
    expect(screen.getByRole('link', { name: /back/i })).toHaveAttribute('href', '/get-started');
    unmount();
    renderShell({ onBack: () => {} });
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
  });

  it('shows no Back when neither is given', () => {
    renderShell();
    expect(screen.queryByText(/back/i)).not.toBeInTheDocument();
  });
});
