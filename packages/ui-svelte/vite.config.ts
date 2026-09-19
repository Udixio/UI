/// <reference types='vitest' />
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { svelteTesting } from '@testing-library/svelte/vite';

// The package build is `svelte-package` (see project.json): this file only
// configures vitest. `browser` must win over the default condition, otherwise
// Svelte resolves its server runtime and nothing mounts in jsdom.
export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/packages/ui-svelte',
  plugins: [svelte(), svelteTesting()],
  resolve: {
    conditions: ['browser', 'development'],
  },
  test: {
    name: 'ui-svelte',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.spec.ts'],
    setupFiles: ['./src/tests/setup.ts'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8' as const,
    },
  },
});
