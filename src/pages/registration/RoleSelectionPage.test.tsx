import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../../features/auth/AuthContext';
import { RoleSelectionPage } from './RoleSelectionPage';

describe('RoleSelectionPage (V2-066)', () => {
  it('routes to the interpreter registration when Interpreter is chosen', async () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <Routes>
            <Route path="/" element={<RoleSelectionPage />} />
            <Route path="/register/interpreter" element={<p>interpreter form</p>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Interpreter' }));
    expect(screen.getByText('interpreter form')).toBeInTheDocument();
  });
});
