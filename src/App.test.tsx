import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the landing page at "/" with the real router', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'SignConnect' })).toBeInTheDocument();
  });
});
