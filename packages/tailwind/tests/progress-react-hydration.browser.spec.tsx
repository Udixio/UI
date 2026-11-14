// @vitest-environment node
import { chromium, firefox, webkit } from 'playwright';
import { build as viteBuild } from 'vite';
import { beforeAll, describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import { motionBrowsers } from './motion-browsers.mjs';
import { renderProgressHydrationFixture } from '../../ui-react/tests/fixtures/progress-hydration-server';

let markup: string;
let client: string;
beforeAll(async () => {
  expect(typeof window).toBe('undefined');
  expect(typeof document).toBe('undefined');
  markup = renderProgressHydrationFixture();
  const result = await viteBuild({
    configFile: false,
    root: resolve(__dirname, '../../..'),
    logLevel: 'error',
    define: { 'process.env.NODE_ENV': JSON.stringify('development') },
    resolve: { conditions: ['development'] },
    oxc: { jsx: { runtime: 'automatic', development: true } },
    build: {
      write: false,
      minify: false,
      lib: {
        entry: resolve(
          __dirname,
          '../../ui-react/tests/fixtures/progress-hydration-client.tsx',
        ),
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
  describe(`React ProgressIndicator SSR hydration in ${name}`, () => {
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
            window.hydrationErrors = [];
            window.before = [...document.querySelectorAll('[role=progressbar]')];
            window.beforeChildren = window.before.map(el => [...el.querySelectorAll('*')]);
            window.initial = window.before.map(el => ({ label: el.getAttribute('aria-label'), labelledby: el.getAttribute('aria-labelledby'), now: el.getAttribute('aria-valuenow'), styles: [...el.children].map(child => child.getAttribute('style')) }));
          </script><script type="module">${client}</script>`);
          await page.waitForFunction(() => (window as any).hydrated === true);
          const state = await page.evaluate(() => {
            const indicators = [
              ...document.querySelectorAll('[role=progressbar]'),
            ];
            return {
              initial: (window as any).initial,
              same:
                indicators.length === 2 &&
                indicators.every(
                  (el, i) =>
                    el === (window as any).before[i] &&
                    [...el.querySelectorAll('*')].every(
                      (child, j) =>
                        child === (window as any).beforeChildren[i][j],
                    ),
                ),
              now: indicators.map((el) => el.getAttribute('aria-valuenow')),
              hydrationErrors: (window as any).hydrationErrors,
            };
          });
          expect(state.same).toBe(true);
          expect(state.now).toEqual([null, null]);
          expect(state.initial[0].labelledby).toBe('progress-name');
          expect(state.initial[1].label).toBe('Loading circle');
          expect(state.initial.map((item: any) => item.now)).toEqual([
            null,
            null,
          ]);
          expect(state.initial[0].styles[0]).toContain('width:20%');
          expect(state.initial[1].styles[0]).toContain(
            'stroke-dasharray:0.25 1',
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
          expect(state.hydrationErrors).toEqual([]);
          await page.evaluate(() => (window as any).dispose());
          expect(errors).toEqual([]);
        } finally {
          await browser.close();
        }
      }, 30000);
    }
  });
}
