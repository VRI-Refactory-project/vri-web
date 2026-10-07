import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { SplashPage } from './SplashPage';

const navigate = vi.fn();

vi.mock('react-router-dom', () => ({
  Link: ({ to, children, ...props }: { to: string; children: ReactNode }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useNavigate: () => navigate,
}));

describe('SplashPage', () => {
  it('renders the SignConnect splash content', () => {
    render(<SplashPage />);

    expect(screen.getByRole('heading', { name: /inclusive communication/i })).toBeInTheDocument();
    expect(screen.getByText(/connect instantly with certified sign-language interpreters/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /log in/i })).toHaveAttribute('href', '/sign-in');
  });

  it('continues to the existing landing page', () => {
    render(<SplashPage />);

    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    expect(navigate).toHaveBeenCalledWith('/landing');
  });
});
