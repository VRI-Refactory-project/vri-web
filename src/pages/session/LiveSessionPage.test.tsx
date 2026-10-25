import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';
import { LiveSessionPage } from './LiveSessionPage';

vi.mock('../../services/sessionRequests', () => ({
  cancelSessionRequest: vi.fn().mockResolvedValue(undefined),
}));
import { cancelSessionRequest } from '../../services/sessionRequests';

function renderPage(role: 'deaf' | 'interpreter') {
  return render(
    <MemoryRouter
      initialEntries={[{ pathname: '/session/7', state: { interpreterName: 'Amina Okafor' } }]}
    >
      <Routes>
        <Route path="/session/:id" element={<LiveSessionPage viewerRole={role} connectMs={10} />} />
        <Route path="/dashboard/deaf" element={<p>Deaf home</p>} />
        <Route path="/dashboard/interpreter" element={<p>Interpreter home</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.mocked(cancelSessionRequest).mockClear();
  // jsdom has no camera: the page must still work and say why.
  Object.defineProperty(navigator, 'mediaDevices', { value: undefined, configurable: true });
});

afterEach(cleanup);

describe('LiveSessionPage', () => {
  it('opens on the lobby and names the interpreter for a Deaf user', () => {
    renderPage('deaf');
    expect(screen.getByText('Ready to connect?')).toBeTruthy();
    expect(screen.getByText('Amina Okafor')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toContain('camera');
  });

  it('cancelling the lobby closes the request and goes home', async () => {
    renderPage('deaf');
    fireEvent.click(screen.getAllByRole('button', { name: /cancel/i })[0]);
    await waitFor(() => expect(screen.getByText('Deaf home')).toBeTruthy());
    expect(cancelSessionRequest).toHaveBeenCalledWith('7');
  });

  it('an interpreter leaving the lobby does not cancel the request', async () => {
    renderPage('interpreter');
    fireEvent.click(screen.getAllByRole('button', { name: /cancel/i })[0]);
    await waitFor(() => expect(screen.getByText('Interpreter home')).toBeTruthy());
    expect(cancelSessionRequest).not.toHaveBeenCalled();
  });

  it('joins, shows the call, then asks before ending', async () => {
    renderPage('deaf');
    fireEvent.click(screen.getByRole('button', { name: /join session/i }));
    expect(screen.getByText('Connecting with Amina Okafor')).toBeTruthy();
    await waitFor(() => expect(screen.getByRole('button', { name: /end call/i })).toBeTruthy());
    expect(screen.getByText('Connected with Amina Okafor')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /end call/i }));
    expect(screen.getByText('End this session?')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /continue session/i }));
    expect(screen.getByRole('button', { name: /end call/i })).toBeTruthy();
  });

  it('shows the session-ended screen after ending', async () => {
    renderPage('deaf');
    fireEvent.click(screen.getByRole('button', { name: /join session/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /end call/i })).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: /end call/i }));
    fireEvent.click(screen.getByRole('button', { name: /^end session$/i }));
    expect(screen.getByRole('heading', { name: 'Session ended' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /back to dashboard/i }));
    expect(screen.getByText('Deaf home')).toBeTruthy();
  });
});
