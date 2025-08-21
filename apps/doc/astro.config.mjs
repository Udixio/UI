// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import { udixioVite } from '@udixio/theme';

import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  vite: {
    plugins: [tailwindcss(), udixioVite()],
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
      components: {
        code: './src/components/Code.tsx',
      },
    }),
    react(),
  ],

  adapter: vercel(),
});
