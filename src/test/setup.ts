import '@testing-library/jest-dom/vitest';
import { beforeEach } from 'vitest';

// The signed-in session lives in localStorage (shared by all tabs), so a session saved by one test
// must not leak into the next one.
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});
