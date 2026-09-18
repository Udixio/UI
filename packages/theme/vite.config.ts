/// <reference types='vitest' />
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import * as path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import { copyFileSync } from 'node:fs';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/packages/theme',

  plugins: [
    dts({
      entryRoot: 'src',
      tsconfigPath: path.join(__dirname, 'tsconfig.lib.json'),
    }),
    {
      // the tarball ships `dist/LICENSE`: copied by this build, so that a
      // package build alone (not only the root `npm run build`) is publishable
      name: 'udixio:license',
      applyToEnvironment: (env) => env.name === 'client',
      closeBundle() {
        copyFileSync(
          path.join(__dirname, '../../LICENSE'),
          path.join(this.environment.config.build.outDir, 'LICENSE'),
        );
      },
    },
    visualizer({
      filename: '../../stats/theme.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },
  // Library build, one environment per runtime. The node environment keeps
  // its dependencies external; the browser one bundles everything (awilix,
  // material-color-utilities) so that `dist/browser.js` is self-contained for
  // bundlers that fetch npm packages whole and resolve nothing further.
  // See: https://vitejs.dev/guide/build.html#library-mode
  build: {
    outDir: './dist',
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    lib: {
      // entries are per environment, below
      entry: {},
      name: '@udixio/theme',
      fileName: (format, entryName) =>
        `${entryName}.${format === 'es' ? 'js' : 'cjs'}`,
      formats: ['es' as const, 'cjs' as const],
    },
  },
  environments: {
    ssr: {
      build: {
        emptyOutDir: true,
        // No identifier mangling for the node build: the WebContainer engine
        // resolved `class e { … new e() }` to a same-named import (`import {
        // InjectionMode as e } from "awilix"`) in the load-from-path chunk.
        minify: false,
        lib: {
          entry: {
            node: 'src/index.node.ts',
            bin: 'bin/main.ts',
          },
        },
        rollupOptions: {
          // External packages that should not be bundled into the node build.
          external: ['pathe', 'jiti', 'commander', 'unplugin', 'chokidar'],
          output: {
            // `dist/bin.js` is the `udixio-theme` CLI: the shebang lets npm's bin
            // shim run it directly instead of going through a `node` wrapper.
            banner: (chunk) =>
              chunk.isEntry && chunk.name === 'bin'
                ? '#!/usr/bin/env node\n'
                : '',
          },
        },
      },
    },
    client: {
      build: {
        // built after the node environment, into the same directory
        emptyOutDir: false,
        lib: {
          entry: {
            browser: 'src/index.browser.ts',
          },
        },
        rollupOptions: {
          external: [],
        },
      },
    },
  },
  builder: {
    buildApp: async (builder) => {
      await builder.build(builder.environments.ssr);
      await builder.build(builder.environments.client);
    },
  },
  test: {
    watch: false,
    globals: true,
    environment: 'node',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8' as const,
    },
  },
}));
