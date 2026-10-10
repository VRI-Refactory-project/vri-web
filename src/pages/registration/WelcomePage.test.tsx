import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../../features/auth/AuthProvider';
import { WelcomePage } from './WelcomePage';

describe('WelcomePage', () => {
  afterEach(() => sessionStorage.clear());

  it('is the third and last step, and leads to the dashboard', async () => {
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/register/welcome']}>
          <Routes>
            <Route path="/register/welcome" element={<WelcomePage />} />
            <Route path="/dashboard/deaf" element={<p>deaf home</p>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    );
    expect(screen.getByRole('navigation', { name: /step 3 of 3/i })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /go to my dashboard/i }));
    expect(screen.getByText('deaf home')).toBeInTheDocument();
  });
});
