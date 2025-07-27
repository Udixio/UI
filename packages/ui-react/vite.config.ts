/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { visualizer } from 'rollup-plugin-visualizer';

import * as path from 'path';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';
import { udixioVite } from '@udixio/theme';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/packages/ui-react',
  plugins: [
    udixioVite(),
    react(),
    nxViteTsPaths(),
    nxCopyAssetsPlugin(['*.md']),
    dts({
      entryRoot: 'src',
      tsconfigPath: path.join(__dirname, 'tsconfig.lib.json'),
      pathsToAliases: false,
      outDir: '../../dist/packages/ui-react/src',
    }),
    visualizer({
      filename: './stats.html', // Le fichier de sortie
      open: true, // Ouvre le rapport automatiquement après le build
      template: 'treemap', // Options : 'treemap', 'sunburst', 'network', etc.
    }),
  ],
  build: {
    outDir: '../../dist/packages/ui-react',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    lib: {
      // Could also be a dictionary or array of multiple entry points.
      entry: 'src/index.ts',
      name: 'ui-react',
      fileName: (format) => (format === 'es' ? 'index.mjs' : 'index.js'),
      formats: ['es' as const, 'cjs' as const],
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react-textarea-autosize',
        'tailwind-merge',
        'motion',
        'motion/react',
      ],
      output: {
        // Ensure proper code splitting for dynamic imports
        manualChunks: (id) => {
          if (id.includes('react-textarea-autosize')) {
            return 'textarea-autosize';
          }
          if (id.includes('tailwind-merge')) {
            return 'tailwind-merge';
          }
          if (id.includes('motion')) {
            return 'motion';
          }
        },
      },
    },
  },
  test: {
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/packages/ui-react',
      provider: 'v8' as const,
    },
  },
}));
