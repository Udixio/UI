// @ts-check
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import pagefind from 'astro-pagefind';
import tailwindcss from '@tailwindcss/vite';

import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import angular from '@analogjs/astro-angular';
import { vitePlugin } from '@udixio/theme';

import astroExpressiveCode from 'astro-expressive-code';

import vercel from '@astrojs/vercel';

const mixedFrameworkJsxCompatibility = {
  name: 'udixio:mixed-framework-jsx-compatibility',
  hooks: {
    'astro:config:setup': ({ command, updateConfig }) => {
      updateConfig({
        vite: {
          // Analog 2.6.3 enables jsxDev globally. React's production runtime
          // does not expose jsxDEV, so restore the mode expected by React.
          esbuild: { jsxDev: command === 'dev' },
        },
      });
    },
  },
};

// https://astro.build/config
export default defineConfig({
  output: 'static',

  vite: {
    plugins: [tailwindcss(), vitePlugin()],
    resolve: {
      alias: {
        '@udixio/ui-angular': fileURLToPath(
          new URL('../../packages/ui-angular/src/index.ts', import.meta.url),
        ),
      },
    },
    optimizeDeps: {
      exclude: ['@udixio/ui-react'],
    },
  },
  markdown: {
    shikiConfig: {
      transformers: [
        {
          // attache la source brute dans une propriété sur <pre>
          pre(hast) {
            hast.properties = hast.properties || {};
            hast.properties['data-code'] = this.source;
            // tu peux aussi attacher metadata: hast.properties['data-meta'] = this.options.meta?.__raw
          },
        },
      ],
    },
  },

  integrations: [
    astroExpressiveCode({
      styleOverrides: {
        borderRadius: '1rem', // Match Card styling
        codeFontFamily:
          'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      },
    }),
    mdx({
      remarkPlugins: [],
      rehypePlugins: [],
      // Configuration des composants personnalisés
    }),
    react(),
    angular({
      vite: {
        // The documentation app mixes React TSX with Angular TypeScript.
        // Restrict Angular compilation to Angular examples and the Angular UI
        // package so both framework integrations can safely coexist.
        transformFilter: (_code, id) =>
          id.includes('/src/examples/angular/') ||
          id.includes('/packages/ui-angular/'),
      },
    }),
    mixedFrameworkJsxCompatibility,
    pagefind(),
  ],

  adapter: vercel(),
});
