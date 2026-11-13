import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { StaffChatPage } from './StaffChatPage';

describe('StaffChatPage', () => {
  it('says chat is not open for staff yet and links back to the dashboard', () => {
    render(
      <MemoryRouter>
        <StaffChatPage />
      </MemoryRouter>,
    );
    expect(screen.getByText('Chat is not available for staff yet')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Back/ })).toHaveAttribute('href', '/dashboard/staff');
  });
});
