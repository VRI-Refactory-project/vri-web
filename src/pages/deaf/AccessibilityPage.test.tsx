import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AccessibilityPage } from './AccessibilityPage';

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.contrast;
  delete document.documentElement.dataset.textSize;
});
afterEach(cleanup);

describe('AccessibilityPage', () => {
  it('starts from the defaults', () => {
    render(<AccessibilityPage />);
    expect(screen.getByRole('switch', { name: 'Captions' }).getAttribute('aria-checked')).toBe(
      'true',
    );
    expect(screen.getByRole('switch', { name: 'High contrast' }).getAttribute('aria-checked')).toBe(
      'false',
    );
  });

  it('turns high contrast on for the whole page and remembers it', () => {
    const { unmount } = render(<AccessibilityPage />);
    fireEvent.click(screen.getByRole('switch', { name: 'High contrast' }));
    expect(document.documentElement.dataset.contrast).toBe('high');
    unmount();
    render(<AccessibilityPage />);
    expect(screen.getByRole('switch', { name: 'High contrast' }).getAttribute('aria-checked')).toBe(
      'true',
    );
  });

  it('changes the text size', () => {
    render(<AccessibilityPage />);
    fireEvent.change(screen.getByLabelText('Text size'), { target: { value: 'large' } });
    expect(document.documentElement.dataset.textSize).toBe('large');
  });
});
