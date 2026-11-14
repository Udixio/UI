import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: import.meta.dirname,
  resolve: {
    alias: [
      {
        find: /^@udixio\/tailwind$/,
        replacement: `${import.meta.dirname}/src/index.node.ts`,
      },
    ],
  },
  test: {
    include: [
      'src/search-motion.browser.spec.ts',
      'src/progress-motion.browser.spec.ts',
      'src/switch-motion.browser.spec.ts',
      'src/slider-motion.browser.spec.ts',
      'tests/slider-adapters.browser.spec.ts',
      'tests/slider-hydration.browser.spec.tsx',
      'tests/slider-svelte-hydration.browser.spec.ts',
      'tests/progress-svelte-hydration.browser.spec.ts',
      'tests/progress-angular-hydration.browser.spec.ts',
      'tests/progress-react-hydration.browser.spec.tsx',
      'tests/slider-angular-hydration.browser.spec.ts',
      'tests/search-{angular,react,svelte}.browser.spec.ts',
      'tests/switch-adapters.browser.spec.ts',
      'tests/switch-hydration.browser.spec.tsx',
      'tests/switch-svelte-hydration.browser.spec.ts',
      'tests/switch-angular-hydration.browser.spec.ts',
    ],
    environment: 'node',
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
