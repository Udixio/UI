import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  root: resolve(__dirname, '..'),
  test: {
    watch: false,
    globals: true,
    environment: 'node',
    include: ['tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: [
      '**/{slider,switch}-adapters.browser.spec.ts',
      '**/search-{angular,react,svelte}.browser.spec.ts',
      '**/{slider,switch}-hydration.browser.spec.tsx',
      '**/{slider,switch,progress}-svelte-hydration.browser.spec.ts',
      '**/{slider,switch}-angular-hydration.browser.spec.ts',
      '**/node_modules/**',
    ],
  },
});
