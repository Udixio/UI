// @vitest-environment node
import { chromium, firefox, webkit } from 'playwright';
import { build as viteBuild } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { beforeAll, describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import { motionBrowsers } from './motion-browsers.mjs';

let markup: string;
let client: string;
beforeAll(async () => {
  expect(typeof window).toBe('undefined');
  expect(typeof document).toBe('undefined');
  const root = resolve(__dirname, '../../..');
  const fixture = resolve(root, 'packages/ui-svelte/tests/fixtures');
  const server = await viteBuild({
    configFile: false,
    root,
    logLevel: 'error',
    plugins: [svelte({ configFile: false })],
    ssr: { noExternal: true },
    build: {
      ssr: resolve(fixture, 'progress-hydration-server.ts'),
      write: false,
      minify: false,
      rollupOptions: { output: { codeSplitting: false } },
    },
  });
  const serverChunk = (Array.isArray(server) ? server[0] : server).output.find(
    (item) => item.type === 'chunk',
  );
  if (!serverChunk || serverChunk.type !== 'chunk')
    throw new Error('SSR bundle missing');
  const { renderFixture } = await import(
    `data:text/javascript;base64,${Buffer.from(serverChunk.code).toString('base64')}`
  );
  markup = renderFixture();
  const result = await viteBuild({
    configFile: false,
    root,
    logLevel: 'error',
    define: { 'process.env.NODE_ENV': JSON.stringify('development') },
    resolve: { conditions: ['browser', 'development'] },
    plugins: [svelte({ configFile: false })],
    build: {
      write: false,
      minify: false,
      lib: {
        entry: resolve(fixture, 'progress-hydration-client.ts'),
        formats: ['es'],
      },
      rollupOptions: { output: { codeSplitting: false } },
    },
  });
  const chunk = (Array.isArray(result) ? result[0] : result).output.find(
    (item) => item.type === 'chunk',
  );
  if (!chunk || chunk.type !== 'chunk')
    throw new Error('Hydration bundle missing');
  client = chunk.code.replace(/<\/script/gi, '<\\/script');
}, 60000);

for (const name of motionBrowsers(process.env.MOTION_BROWSERS)) {
  const engine = { chromium, firefox, webkit }[
    name as 'chromium' | 'firefox' | 'webkit'
  ];
  describe(`Svelte ProgressIndicator SSR hydration in ${name}`, () => {
    for (const reducedMotion of ['reduce', 'no-preference'] as const) {
      it(`preserves accessible server nodes with ${reducedMotion}`, async () => {
        const browser = await engine.launch();
        try {
          const page = await browser.newPage({ reducedMotion });
          const errors: string[] = [];
          page.on('pageerror', (error) => errors.push(error.message));
          page.on('console', (message) => {
            if (message.type() === 'error' || message.type() === 'warning')
              errors.push(message.text());
          });
          await page.setContent(`<div id="root">${markup}</div><script>
            window.before = [...document.querySelectorAll('[role=progressbar]')];
            window.beforeChildren = window.before.map(el => [...el.querySelectorAll('*')]);
            window.initial = window.before.map(el => ({ name: el.getAttribute('aria-label'), labelledby: el.getAttribute('aria-labelledby'), now: el.getAttribute('aria-valuenow'), styles: [...el.children].map(child => child.getAttribute('style')) }));
          </script><script type="module">${client}</script>`);
          await page.waitForFunction(() => (window as any).hydrated === true);
          const state = await page.evaluate(() => {
            const indicators = [
              ...document.querySelectorAll('[role=progressbar]'),
            ];
            return {
              initial: (window as any).initial,
              same: indicators.every(
                (el, i) =>
                  el === (window as any).before[i] &&
                  [...el.querySelectorAll('*')].every(
                    (child, j) =>
                      child === (window as any).beforeChildren[i][j],
                  ),
              ),
              now: indicators.map((el) => el.getAttribute('aria-valuenow')),
            };
          });
          expect(state.same).toBe(true);
          expect(state.now).toEqual([null, null]);
          expect(state.initial[0].labelledby).toBe('progress-name');
          expect(state.initial[1].name).toBe('Loading circle');
          expect(state.initial.map((item: any) => item.now)).toEqual([
            null,
            null,
          ]);
          expect(state.initial[0].styles[0]).toContain('width: 20%');
          expect(state.initial[1].styles[0]).toContain(
            'stroke-dasharray: 0.25 1',
          );
          expect(
            await page
              .locator('svg[role="progressbar"] circle')
              .getAttribute('r'),
          ).toBe('22');
          expect(
            await page
              .getByRole('progressbar', { name: 'Loading', exact: true })
              .count(),
          ).toBe(1);
          expect(
            await page
              .getByRole('progressbar', { name: 'Loading circle' })
              .count(),
          ).toBe(1);
          await page.evaluate(() => (window as any).dispose());
          expect(errors).toEqual([]);
        } finally {
          await browser.close();
        }
      }, 30000);
    }
  });
}
