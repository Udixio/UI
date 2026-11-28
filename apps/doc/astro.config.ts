// @ts-check
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig, fontProviders } from 'astro/config';
import pagefind from 'astro-pagefind';
import tailwindcss from '@tailwindcss/vite';

import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import angular from '@analogjs/astro-angular';
import svelte from '@astrojs/svelte';
import vitePlugin from '@udixio/theme/vite';

import sitemap from '@astrojs/sitemap';
import robotsTxt from 'astro-robots-txt';
import compress from 'astro-compress';
import compressor from 'astro-compressor';

import vercel from '@astrojs/vercel';
import { htmlExamplesPlugin } from './src/lib/html-example';
import {
  canonicalUrl,
  frameworkRedirects,
  isFrameworkStub,
} from './src/lib/framework-url';

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

const SITE = 'https://ui.udixio.fr/';

/**
 * The bare URL of each page of the `pages` collection (`src/data/pages/**`), named as `src/pages/[...url].astro` names it:
 * its file without the extension, and without its `/index`.
 */
function pageCollectionUrls(): string[] {
  const directory = fileURLToPath(
    new URL('./src/data/pages/', import.meta.url),
  );
  return readdirSync(directory, { encoding: 'utf8', recursive: true })
    .filter((file) => /\.mdx?$/.test(file))
    .map(
      (file) =>
        `/${file.replace(/\.mdx?$/, '')}`.replace(/\/index$/, '') || '/',
    );
}

// https://astro.build/config
export default defineConfig({
  site: SITE,
  output: 'static',
  compressHTML: true,

  // The prefixed addresses that are not readings redirect with a 301 (framework-urls spec §2.6).
  redirects: {
    ...frameworkRedirects([
      ...pageCollectionUrls(),
      '/themes',
      '/theme/builder',
      '/',
    ]),
    // The old builder address: a host redirect, not a page of the site.
    '/themes': '/theme/builder',
  },

  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Roboto',
      cssVariable: '--font-roboto',
      options: {
        variants: [
          { src: ['@fontsource/roboto/files/roboto-latin-400-normal.woff2'], weight: 400 },
          { src: ['@fontsource/roboto/files/roboto-latin-500-normal.woff2'], weight: 500 },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: 'Montserrat',
      cssVariable: '--font-montserrat',
      options: {
        variants: [
          { src: ['@fontsource/montserrat/files/montserrat-latin-400-normal.woff2'], weight: 400 },
          { src: ['@fontsource/montserrat/files/montserrat-latin-500-normal.woff2'], weight: 500 },
        ],
      },
    },
  ],

  vite: {
    // The scripts of the HTML examples, bundled, for their live previews (src/lib/html-example.ts).
    plugins: [
      tailwindcss(),
      vitePlugin(),
      htmlExamplesPlugin(fileURLToPath(new URL('./src/examples/html', import.meta.url))),
    ],
    // The workspace resolves @udixio/motion to its sources (`development` condition), where the build flag of its
    // development checks is not replaced: there, the sources are development (packages/motion/src/build-flags.d.ts).
    define: { __MOTION_CHECKS__: 'true' },
    resolve: {
      alias: {
        '@udixio/ui-react': fileURLToPath(
          new URL('../../packages/ui-react/src/index.ts', import.meta.url),
        ),
        '@udixio/ui-angular': fileURLToPath(
          new URL('../../packages/ui-angular/src/index.ts', import.meta.url),
        ),
        '@udixio/ui-svelte': fileURLToPath(
          new URL('../../packages/ui-svelte/src/index.ts', import.meta.url),
        ),
      },
    },
    optimizeDeps: {
      // Astro makes every component and example of src a scan entry, so the dependency scan parses the example that shows
      // react-router as text (its ?raw read). The doc does not depend on react-router: excluded, the bare import is left
      // unresolved instead of failing the scan.
      exclude: ['@udixio/ui-react', 'react-router'],
    },
  },
  markdown: {
    shikiConfig: {
      transformers: [
        {
          // attach the raw source as a property on <pre>
          pre(hast) {
            hast.properties = hast.properties || {};
            hast.properties['data-code'] = this.source;
            // metadata can also be attached: hast.properties['data-meta'] = this.options.meta?.__raw
          },
        },
      ],
    },
  },

  integrations: [
    mdx({
      remarkPlugins: [],
      rehypePlugins: [],
      // Custom components configuration
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
    svelte(),
    mixedFrameworkJsxCompatibility,
    pagefind(),
    // The test fixtures under /motion/fixtures/ are pages for the browser tests, not documentation; the roadmap is reached
    // by its URL only; a stub (/motion/presence) is no page, its readings are.
    sitemap({
      filter: (page) =>
        !page.includes('/motion/fixtures/') &&
        !page.includes('/motion/roadmap') &&
        !isFrameworkStub(new URL(page).pathname),
      serialize: (item) => ({ ...item, url: canonicalUrl(item.url, SITE) }),
    }),
    robotsTxt(),
    // astro-compress's HTML minifier drops the `<!-- -->` separators React writes between text nodes,
    // so the hydration of `Value: {value}` finds one text node where the server wrote two.
    compress({ HTML: false }),
    compressor(),
  ],

  adapter: vercel(),
});
