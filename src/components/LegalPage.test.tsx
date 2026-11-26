import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeAll, describe, expect, it } from 'vitest';
import { PrivacyPage, TermsPage } from './LegalPage';

// jsdom does not scroll, so give elements a no-op scrollIntoView.
beforeAll(() => {
  Element.prototype.scrollIntoView = () => {};
});

function renderAt(entries: string[]) {
  return render(
    <MemoryRouter initialEntries={entries}>
      <Routes>
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/register/deaf" element={<p>sign-up page</p>} />
        <Route path="/sign-in" element={<p>sign-in page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Terms and Privacy pages', () => {
  it('show the SignConnect logo on the left and a Back button on the right', () => {
    renderAt(['/terms']);
    expect(screen.getByAltText('SignConnect')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
  });

  it('Back returns to the sign-up page the person came from, not to sign-in', async () => {
    const user = userEvent.setup();
    renderAt(['/register/deaf', '/terms']);

    await user.click(screen.getByRole('button', { name: /back/i }));

    expect(screen.getByText('sign-up page')).toBeInTheDocument();
    expect(screen.queryByText('sign-in page')).not.toBeInTheDocument();
  });

  it('Back still returns to sign-up after moving from Terms to Privacy', async () => {
    const user = userEvent.setup();
    renderAt(['/register/deaf', '/terms']);

    await user.click(screen.getByRole('link', { name: /privacy policy/i }));
    await user.click(screen.getByRole('button', { name: /back/i }));

    expect(screen.getByText('sign-up page')).toBeInTheDocument();
  });

  it('Back goes to sign-in when the page was opened directly', async () => {
    const user = userEvent.setup();
    renderAt(['/terms']);

    await user.click(screen.getByRole('button', { name: /back/i }));

    expect(screen.getByText('sign-in page')).toBeInTheDocument();
  });
});
