import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LandingPage } from './LandingPage';

describe('LandingPage', () => {
  const renderPage = () =>
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/get-started" element={<p>role selection</p>} />
          <Route path="/sign-in" element={<p>sign in page</p>} />
        </Routes>
      </MemoryRouter>,
    );

 it('renders the hero heading', () => {
   renderPage();

 expect(
   screen.getByRole('heading', {
     name: 'Inclusive Communication. Anytime, Anywhere',
   }),
 ).toBeInTheDocument();
 });

  it('navigates to /get-started when Get Started is clicked', async () => {
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: /get started/i }));
    expect(screen.getByText('role selection')).toBeInTheDocument();
  });

  it('navigates to /get-started when Sign Up is clicked', async () => {
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: /sign up/i }));
    expect(screen.getByText('role selection')).toBeInTheDocument();
  });

  it('navigates to /sign-in when Login is clicked', async () => {
    renderPage();
    await userEvent.click(screen.getByRole('link', { name: /login/i }));
    expect(screen.getByText('sign in page')).toBeInTheDocument();
  });
});
