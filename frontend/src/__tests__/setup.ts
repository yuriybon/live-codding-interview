/**
 * Vitest setup file
 * Runs before all tests
 */

// Add any global test setup here
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});
