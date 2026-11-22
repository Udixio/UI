/// <reference types='vitest' />
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import * as path from 'path';
import { existsSync, readdirSync, rmSync } from 'node:fs';
import { playwright } from '@vitest/browser-playwright';

const browsers = (process.env.MOTION_BROWSERS ?? 'chromium,firefox,webkit')
  .split(',')
  .map((browser) => browser.trim() as 'chromium' | 'firefox' | 'webkit');

// The development checks (`__MOTION_CHECKS__`, see src/build-flags.d.ts). The default build keeps them behind the test that
// reads `process`, which a plain page does not have. The `development` build (`vite build --mode development`) sets them on and
// goes to dist/development, which the `development` export condition of the publish map names.
const CHECKS = "(typeof process === 'object' && process.env.NODE_ENV !== 'production')";

/**
 * Empties what this build writes before it writes: the default build empties dist except dist/development, and the development
 * build empties dist/development.
 */
function keepOwnOutput(development: boolean) {
  // Vite runs one build per output format (es, then cjs), each with build start: the folder is emptied by the first of them,
  // before anything is written. Not in the config hook, which tools also run to read the config.
  let emptied = false;
  return {
    name: 'keep-own-output',
    apply: 'build' as const,
    buildStart() {
      if (emptied) return;
      emptied = true;
      const dist = path.join(import.meta.dirname, 'dist');
      if (!existsSync(dist)) return;
      if (development) {
        rmSync(path.join(dist, 'development'), { recursive: true, force: true });
        return;
      }
      for (const name of readdirSync(dist))
        if (name !== 'development') rmSync(path.join(dist, name), { recursive: true, force: true });
    },
  };
}

export default defineConfig(({ mode }) => {
  const development = mode === 'development';
  return {
    root: import.meta.dirname,
    cacheDir: '../../node_modules/.vite/packages/motion',
    define: {
      __MOTION_CHECKS__: development ? 'true' : CHECKS,
    },
    plugins: [
      // First, so that its build start runs before the declarations are written.
      keepOwnOutput(development),
      // The development build shares the declarations of the default build: it emits none of its own.
      ...(development
        ? []
        : [
            dts({
              entryRoot: 'src',
              tsconfigPath: path.join(import.meta.dirname, 'tsconfig.lib.json'),
            }),
          ]),
    ],
    // See: https://vite.dev/guide/build.html#library-mode
    build: {
      outDir: development ? './dist/development' : './dist',
      emptyOutDir: false,
      reportCompressedSize: true,
      lib: {
        entry: {
          index: 'src/index.ts',
          policy: 'src/policy.ts',
          active: 'src/active.ts',
          presets: 'src/presets.ts',
          layout: 'src/layout.ts',
          value: 'src/value-entry.ts',
          sequence: 'src/sequence-entry.ts',
          gesture: 'src/gesture-entry.ts',
          text: 'src/text-entry.ts',
          svg: 'src/svg-entry.ts',
          scroll: 'src/scroll-entry.ts',
          animate: 'src/animate-entry.ts',
          page: 'src/page.ts',
          continuous: 'src/continuous-entry.ts',
          scope: 'src/scope-entry.ts',
          astro: 'src/astro.ts',
          manifest: 'src/manifest.ts',
          'providers/css': 'src/providers/css.ts',
          'providers/waapi': 'src/providers/waapi.ts',
          'providers/animejs': 'src/providers/animejs.ts',
          'testing/index': 'src/testing/index.ts',
        },
        name: '@udixio/motion',
        fileName: (format, entryName) => `${entryName}.${format === 'cjs' ? 'cjs' : 'js'}`,
        formats: ['es' as const, 'cjs' as const],
      },
      rollupOptions: {
        // animejs is the only JS animation engine: a dependency of this package, installed with it, which the bundle does not inline.
        external: ['animejs', 'animejs/svg'],
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
            setupFiles: ['scripts/vitest-checks-setup.mjs'],
          },
        },
        {
          test: {
            name: 'browser',
            include: ['src/**/*.browser.spec.ts'],
            setupFiles: ['scripts/vitest-browser-setup.mjs', 'scripts/vitest-checks-setup.mjs'],
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
  };
});
