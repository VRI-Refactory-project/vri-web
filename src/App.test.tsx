import { describe, it, expect } from 'vitest';

describe('Basic Setup', () => {
  it('should pass this dummy test to satisfy the CI pipeline', () => {
    // This test simply checks that basic math works.
    // It proves the testing framework is running correctly.
    expect(1 + 1).toBe(2);
  });
});