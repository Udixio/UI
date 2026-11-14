/// <reference types='vitest' />
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import * as path from 'path';
import { playwright } from '@vitest/browser-playwright';

const browsers = (process.env.MOTION_BROWSERS ?? 'chromium,firefox,webkit')
  .split(',')
  .map((browser) => browser.trim() as 'chromium' | 'firefox' | 'webkit');

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/packages/motion',
  plugins: [
    dts({
      entryRoot: 'src',
      tsconfigPath: path.join(import.meta.dirname, 'tsconfig.lib.json'),
    }),
  ],
  // See: https://vite.dev/guide/build.html#library-mode
  build: {
    outDir: './dist',
    emptyOutDir: true,
    reportCompressedSize: true,
    lib: {
      entry: {
        index: 'src/index.ts',
        'internal-policy': 'src/internal-policy.ts',
        manifest: 'src/manifest.ts',
        'providers/css': 'src/providers/css.ts',
        'providers/waapi': 'src/providers/waapi.ts',
        'providers/animejs': 'src/providers/animejs.ts',
        'testing/index': 'src/testing/index.ts',
      },
      name: '@udixio/motion',
      fileName: (format, entryName) =>
        `${entryName}.${format === 'cjs' ? 'cjs' : 'js'}`,
      formats: ['es' as const, 'cjs' as const],
    },
    rollupOptions: {
      // animejs is the only JS animation engine: consumers install it, the
      // bundle does not inline it.
      external: ['animejs'],
    },
  },
  test: {
    watch: false,
    globals: true,
    passWithNoTests: true,
    projects: [
      {
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/**/*.spec.ts'],
          exclude: ['**/*.browser.spec.ts'],
        },
      },
      {
        test: {
          name: 'browser',
          include: ['src/**/*.browser.spec.ts'],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: browsers.map((browser) => ({ browser })),
          },
        },
      },
    ],
    reporters: ['default'],
    coverage: {
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8' as const,
    },
  },
}));
