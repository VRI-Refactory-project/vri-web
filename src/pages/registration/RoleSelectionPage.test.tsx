import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../../features/auth/AuthProvider';
import { RoleSelectionPage } from './RoleSelectionPage';

describe('RoleSelectionPage (V2-066)', () => {
  it('routes to the interpreter registration when Interpreter is chosen', async () => {
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/get-started']}>
          <Routes>
            <Route path="/get-started" element={<RoleSelectionPage />} />
            <Route
              path="/register/interpreter"
              element={<p>interpreter form</p>}
            />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    );

    await userEvent.click(
      screen.getByRole('button', { name: /interpreter/i })
    );

    expect(screen.getByText('interpreter form')).toBeInTheDocument();
  });
});