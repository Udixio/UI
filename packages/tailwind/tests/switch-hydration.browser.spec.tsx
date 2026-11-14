import { generateDocTheme } from './doc-theme';
// @vitest-environment node
import { chromium, firefox, webkit } from 'playwright';
import { compile } from '@tailwindcss/node';
import { readFileSync } from 'node:fs';
import { switchStyle } from '../../core/src/lib/styles/switch.style';
import { build as viteBuild } from 'vite';
import { beforeAll, describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import { motionBrowsers } from './motion-browsers.mjs';
import { renderSwitchHydrationFixture } from '../../ui-react/tests/fixtures/switch-hydration-server';

let markup: string;
let client: string;
let css: string;
beforeAll(async () => {
  expect(typeof window).toBe('undefined');
  expect(typeof document).toBe('undefined');
  markup = renderSwitchHydrationFixture();
  const root = resolve(__dirname, '../../..');
  const theme = await generateDocTheme();
  const { build } = await compile(`@import "tailwindcss";\n${theme}`, {
    base: resolve(root, 'apps/doc'),
    onDependency: () => {},
  });
  const classes = [false, true].flatMap((isChecked) =>
    Object.values(
      switchStyle({ isChecked } as Parameters<typeof switchStyle>[0]),
    ).flatMap((value) => value.split(/\s+/)),
  );
  css =
    build(classes) +
    [
      'motion-springs.generated.css',
      'motion-curves.generated.css',
      'motion.css',
    ]
      .map((file) =>
        readFileSync(
          resolve(root, 'packages/motion/public', file),
          'utf8',
        ).replace(/^@import.*;$/gm, ''),
      )
      .join('\n');
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
          '../../ui-react/tests/fixtures/switch-hydration-client.tsx',
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
  describe(`React Switch SSR hydration in ${name}`, () => {
    for (const reducedMotion of ['reduce', 'no-preference'] as const) {
      it(`preserves the server node and resting offset with ${reducedMotion}`, async () => {
        const browser = await engine.launch();
        try {
          const page = await browser.newPage({ reducedMotion });
          const errors: string[] = [];
          page.on('pageerror', (error) => errors.push(error.message));
          page.on('console', (message) => {
            if (message.type() === 'error' || message.type() === 'warning')
              errors.push(message.text());
          });
          await page.setContent(`<style>${css}</style><div id="root">${markup}</div><script>
            window.hydrationErrors = [];
            window.policyMediaListeners = new Set();
            window.policyObservers = new Set();
            const mediaAdd = MediaQueryList.prototype.addEventListener;
            const mediaRemove = MediaQueryList.prototype.removeEventListener;
            MediaQueryList.prototype.addEventListener = function(type, listener, options) {
              if (type === 'change' && this.media.replace(/\\s+/g, '') === '(prefers-reduced-motion:reduce)') window.policyMediaListeners.add(listener);
              return mediaAdd.call(this, type, listener, options);
            };
            MediaQueryList.prototype.removeEventListener = function(type, listener, options) {
              if (type === 'change') window.policyMediaListeners.delete(listener);
              return mediaRemove.call(this, type, listener, options);
            };
            const observe = MutationObserver.prototype.observe;
            const disconnect = MutationObserver.prototype.disconnect;
            MutationObserver.prototype.observe = function(target, options) {
              if (target === document.documentElement && options.attributeFilter?.includes('data-motion-policy')) window.policyObservers.add(this);
              return observe.call(this, target, options);
            };
            MutationObserver.prototype.disconnect = function() { window.policyObservers.delete(this); return disconnect.call(this); };
            window.serverSwitch = document.querySelector('[role=switch]');
            window.serverThumb = window.serverSwitch.firstElementChild;
            window.motionSamples = new Promise(resolve => {
              const samples = [];
              let hydratedAt;
              const sample = () => {
                if (window.hydrated && hydratedAt === undefined) hydratedAt = performance.now();
                samples.push([getComputedStyle(window.serverThumb).translate,
                  getComputedStyle(window.serverSwitch).visibility,
                  getComputedStyle(window.serverSwitch).display,
                  window.serverThumb.getAnimations().filter(animation => animation.playState === 'running').length]);
                if (hydratedAt !== undefined && performance.now() - hydratedAt >= 250) resolve(samples);
                else requestAnimationFrame(sample);
              };
              sample();
            });
            window.beforeHydration = { translate: window.serverThumb.style.translate, visibility: getComputedStyle(window.serverSwitch).visibility, display: getComputedStyle(window.serverSwitch).display };
            window.changes = [];
            new MutationObserver(records => records.forEach(record => window.changes.push([record.attributeName, window.serverThumb.style.translate, getComputedStyle(window.serverSwitch).visibility, getComputedStyle(window.serverSwitch).display]))).observe(window.serverSwitch, { attributes: true, subtree: true });
          </script><script type="module">${client}</script>`);
          await page
            .waitForFunction(
              () => (window as any).hydrated === true,
              undefined,
              { timeout: 5000 },
            )
            .catch(() => {
              throw new Error(`Client did not load: ${errors.join('; ')}`);
            });
          const control = page.getByRole('switch', { name: 'Hydrated switch' });
          await expect
            .poll(() =>
              control
                .locator(':scope > div')
                .first()
                .getAttribute('data-udx-switch-motion-reduce'),
            )
            .toBe(reducedMotion === 'reduce' ? '' : null);
          expect(
            await page.evaluate(() => ({
              sameSwitch:
                document.querySelector('[role=switch]') ===
                (window as any).serverSwitch,
              sameThumb:
                document.querySelector('[role=switch]')?.firstElementChild ===
                (window as any).serverThumb,
              before: (window as any).beforeHydration,
              changes: (window as any).changes,
              errors: (window as any).hydrationErrors,
            })),
          ).toMatchObject({
            sameSwitch: true,
            sameThumb: true,
            before: {
              translate: '20px',
              visibility: 'visible',
              display: 'inline-flex',
            },
            errors: [],
          });
          const changes = await page.evaluate(
            () => (window as any).changes as [string, string, string, string][],
          );
          expect(
            changes.every(
              ([, translate, visibility, display]) =>
                translate === '20px' &&
                visibility === 'visible' &&
                display !== 'none',
            ),
          ).toBe(true);
          // Sampling starts before the client bundle and lasts beyond the 150 ms tween.
          const samples = await page.evaluate(
            () =>
              (window as any).motionSamples as Promise<
                [string, string, string, number][]
              >,
          );
          expect(samples.length).toBeGreaterThan(0);
          expect(
            samples.every(
              ([translate, visibility, display, animations]) =>
                translate === '20px' &&
                visibility === 'visible' &&
                display !== 'none' &&
                animations === 0,
            ),
          ).toBe(true);
          await control.focus();
          await page.keyboard.press('Space');
          await expect
            .poll(() => control.getAttribute('aria-checked'))
            .toBe('false');
          await expect
            .poll(() =>
              control
                .locator(':scope > div')
                .first()
                .evaluate((el) => (el as HTMLElement).style.translate),
            )
            .toBe('0px');
          expect(
            await page.evaluate(() => [
              (window as any).policyMediaListeners.size,
              (window as any).policyObservers.size,
            ]),
          ).toEqual([1, 1]);
          await page.evaluate(() => (window as any).dispose());
          expect(
            await page.evaluate(() => [
              (window as any).policyMediaListeners.size,
              (window as any).policyObservers.size,
            ]),
          ).toEqual([0, 0]);
          expect(
            await page.evaluate(() => (window as any).serverSwitch.isConnected),
          ).toBe(false);
          expect(errors).toEqual([]);
        } finally {
          await browser.close();
        }
      }, 30000);
    }
  });
}
