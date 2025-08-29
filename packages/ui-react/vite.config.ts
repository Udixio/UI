/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import * as path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

const getUdixioVite = async () => {
  // @ts-expect-error - NX_GRAPH_CREATION is a global variable set by Nx
  if (global.NX_GRAPH_CREATION) {
    return;
  } else {
    const dynamicPath = '@udixio/theme';
    return (await import(dynamicPath)).vitePlugin;
  }
};

export default defineConfig(async () => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/packages/ui-react',
  plugins: [
    await getUdixioVite(),
    react(),
    dts({
      entryRoot: 'src',
      tsconfigPath: path.join(__dirname, 'tsconfig.lib.json'),
    }),
    visualizer({
      filename: '../../stats/ui-react.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },
  // Configuration for building your library.
  // See: https://vitejs.dev/guide/build.html#library-mode
  build: {
    outDir: './dist',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    lib: {
      ssr: true,
      // Could also be a dictionary or array of multiple entry points.
      entry: 'src/index.ts',
      name: '@udixio/ui-react',
      fileName: 'index',
      // Change this to the formats you want to support.
      // Don't forget to update your package.json as well.
      formats: ['es' as const, 'cjs' as const],
    },
    rollupOptions: {
      // External packages that should not be bundled into your library.
      external: [
        'react',
        'clsx',
        'throttle-debounce',
        'react-dom',
        'react/jsx-runtime',
        'react-textarea-autosize',
        'tailwind-merge',
        'motion',
        '@udixio/theme',
        '@udixio/tailwind',
        'motion/react',
      ],
    },
  },
  test: {
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8' as const,
    },
  },
}));
