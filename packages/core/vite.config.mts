/// <reference types='vitest' />
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import * as path from 'path';
import { playwright } from '@vitest/browser-playwright';

// Browser specs (`*.browser.spec.ts`) drive the controllers in real Chromium, Firefox and WebKit: CORE_BROWSERS selects them.
const browsers = (process.env.CORE_BROWSERS ?? 'chromium,firefox,webkit')
  .split(',')
  .map((browser) => browser.trim() as 'chromium' | 'firefox' | 'webkit');

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/packages/core',
  plugins: [
    dts({
      entryRoot: 'src',
      tsconfigPath: path.join(import.meta.dirname, 'tsconfig.lib.json'),
    }),
  ],
  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [],
  // },
  // Configuration for building your library.
  // See: https://vite.dev/guide/build.html#library-mode
  build: {
    outDir: './dist',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    lib: {
      // Could also be a dictionary or array of multiple entry points.
      entry: {
        index: 'src/index.ts',
        dom: 'src/dom.ts',
      },
      name: '@udixio/core',
      fileName: (format, entryName) =>
        `${entryName}.${format === 'cjs' ? 'cjs' : 'js'}`,
      // Change this to the formats you want to support.
      // Don't forget to update your package.json as well.
      formats: ['es' as const, 'cjs' as const],
    },
    rollupOptions: {
      // External packages that should not be bundled into your library.
      external: [
        '@udixio/motion',
        '@udixio/motion/policy',
        '@udixio/motion/animate',
        'react',
        'react/jsx-runtime',
        'clsx',
        'tailwind-merge',
        '@fortawesome/fontawesome-svg-core',
      ],
    },
  },
  test: {
    name: '@udixio/core',
    watch: false,
    globals: true,
    passWithNoTests: true,
    projects: [
      {
        test: {
          name: 'unit',
          globals: true,
          environment: 'node',
          include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
          exclude: ['**/*.browser.spec.ts', '**/node_modules/**'],
        },
      },
      {
        test: {
          name: 'browser',
          globals: true,
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
