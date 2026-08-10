// @ts-check
import { fileURLToPath } from 'node:url';
import { defineConfig, fontProviders } from 'astro/config';
import pagefind from 'astro-pagefind';
import tailwindcss from '@tailwindcss/vite';

import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import angular from '@analogjs/astro-angular';
import { vitePlugin } from '@udixio/theme';

import sitemap from '@astrojs/sitemap';
import robotsTxt from 'astro-robots-txt';
import compress from 'astro-compress';
import compressor from 'astro-compressor';

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
  site: 'https://ui.udixio.fr/',
  output: 'static',
  compressHTML: true,

  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Roboto',
      cssVariable: '--font-roboto',
      weights: [400, 500],
    },
    {
      provider: fontProviders.google(),
      name: 'Montserrat',
      cssVariable: '--font-montserrat',
      weights: [400, 500],
    },
  ],

  vite: {
    plugins: [tailwindcss(), vitePlugin()],
    resolve: {
      alias: {
        '@udixio/ui-react': fileURLToPath(
          new URL('../../packages/ui-react/src/index.ts', import.meta.url),
        ),
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
    sitemap(),
    robotsTxt(),
    compress(),
    compressor(),
  ],

  adapter: vercel(),
});
