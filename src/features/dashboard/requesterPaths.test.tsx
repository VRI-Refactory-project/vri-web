import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { useRequesterPaths } from './requesterPaths';

const at = (path: string) => ({ children }: { children: ReactNode }) => (
  <MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>
);

describe('useRequesterPaths', () => {
  it('keeps a Deaf user inside their own dashboard', () => {
    const { result } = renderHook(() => useRequesterPaths(), {
      wrapper: at('/dashboard/deaf/sessions/new'),
    });
    expect(result.current.home).toBe('/dashboard/deaf');
    expect(result.current.scheduleBack).toBe('/dashboard/deaf/sessions');
    expect(result.current.live(5)).toBe('/live/deaf/5');
  });

  it('keeps institution staff inside the staff area', () => {
    const { result } = renderHook(() => useRequesterPaths(), {
      wrapper: at('/dashboard/staff/start-session'),
    });
    expect(result.current.home).toBe('/dashboard/staff');
    expect(result.current.scheduleBack).toBe('/dashboard/staff');
    expect(result.current.live('7')).toBe('/live/institution/7');
  });
});
