import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { OfflineGate } from './OfflineGate';

function renderGate() {
  return render(
    <MemoryRouter initialEntries={['/sign-up']}>
      <Routes>
        <Route element={<OfflineGate />}>
          <Route path="/sign-up" element={<p>App content</p>} />
          <Route path="/offline" element={<p>Offline route</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('OfflineGate', () => {
  it('shows only the app when the internet is on', () => {
    renderGate();

    expect(screen.getByText('App content')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: "You're offline" })).not.toBeInTheDocument();
  });

  it('shows the offline overlay when the internet drops and hides it when it returns', () => {
    renderGate();

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    expect(screen.getByRole('heading', { name: "You're offline" })).toBeInTheDocument();
    expect(screen.getByText('App content')).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    expect(screen.queryByRole('heading', { name: "You're offline" })).not.toBeInTheDocument();
  });

  it('dismisses the overlay without leaving the current page', () => {
    renderGate();

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    fireEvent.click(screen.getByRole('button', { name: /go back/i }));

    expect(screen.getByText('App content')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: "You're offline" })).not.toBeInTheDocument();
  });
});
