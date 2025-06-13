import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      include: ['src/**'],
    },
    setupFiles: ['vitest.setup.ts'],
  },
});
