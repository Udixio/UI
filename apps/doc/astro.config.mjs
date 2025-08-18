// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import mdx from '@astrojs/mdx';
import { udixioVite } from '@udixio/theme';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss(), udixioVite()],
  },

  integrations: [mdx()],
});
