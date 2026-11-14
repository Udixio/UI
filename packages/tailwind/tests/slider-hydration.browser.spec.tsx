import { generateDocTheme } from './doc-theme';
// @vitest-environment node
import { chromium, firefox, webkit } from 'playwright';
import { compile } from '@tailwindcss/node';
import { readFileSync } from 'node:fs';
import { sliderStyle } from '../../core/src/lib/styles/slider.style';
import { build as viteBuild } from 'vite';
import { beforeAll, describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import { motionBrowsers } from './motion-browsers.mjs';
import { renderSliderHydrationFixture } from '../../ui-react/tests/fixtures/slider-hydration-server';

let markup: string;
let client: string;
let css: string;
beforeAll(async () => {
  expect(typeof window).toBe('undefined');
  expect(typeof document).toBe('undefined');
  markup = renderSliderHydrationFixture();
  const root = resolve(__dirname, '../../..');
  const theme = await generateDocTheme();
  const { build } = await compile(`@import "tailwindcss";\n${theme}`, {
    base: resolve(root, 'apps/doc'),
    onDependency: () => {},
  });
  const classes = [false, true].flatMap((isChanging) =>
    Object.values(
      sliderStyle({ isChanging } as Parameters<typeof sliderStyle>[0]),
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
          '../../ui-react/tests/fixtures/slider-hydration-client.tsx',
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
  describe(`React Slider SSR hydration in ${name}`, () => {
    for (const reducedMotion of ['reduce', 'no-preference'] as const) {
      it(`preserves server markup without initial motion with ${reducedMotion}`, async () => {
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
            const add = MediaQueryList.prototype.addEventListener;
            const remove = MediaQueryList.prototype.removeEventListener;
            MediaQueryList.prototype.addEventListener = function(type, listener, options) {
              if (type === 'change' && this.media.replace(/\\s+/g, '') === '(prefers-reduced-motion:reduce)') window.policyMediaListeners.add(listener);
              return add.call(this, type, listener, options);
            };
            MediaQueryList.prototype.removeEventListener = function(type, listener, options) {
              if (type === 'change') window.policyMediaListeners.delete(listener);
              return remove.call(this, type, listener, options);
            };
            const observe = MutationObserver.prototype.observe;
            const disconnect = MutationObserver.prototype.disconnect;
            MutationObserver.prototype.observe = function(target, options) {
              if (target === document.documentElement && options.attributeFilter?.includes('data-motion-policy')) window.policyObservers.add(this);
              return observe.call(this, target, options);
            };
            MutationObserver.prototype.disconnect = function() { window.policyObservers.delete(this); return disconnect.call(this); };
            window.serverSlider = document.querySelector('[role=slider]');
            window.serverNodes = [...window.serverSlider.querySelectorAll('*')];
            window.indicator = window.serverSlider.querySelector(':scope > div:nth-of-type(2) > div > div');
            window.before = { min: window.serverSlider.getAttribute('aria-valuemin'), max: window.serverSlider.getAttribute('aria-valuemax'), now: window.serverSlider.getAttribute('aria-valuenow'), text: window.serverSlider.getAttribute('aria-valuetext'), transform: window.indicator.style.transform };
            window.startedAnimations = [];
            const animate = Element.prototype.animate;
            Element.prototype.animate = function(...args) {
              if (window.serverSlider.contains(this)) window.startedAnimations.push(args);
              return animate.apply(this, args);
            };
            window.samples = new Promise(resolve => {
              const samples = [];
              let hydratedAt;
              const sample = () => {
                if (window.hydrated && hydratedAt === undefined) hydratedAt = performance.now();
                samples.push([getComputedStyle(window.indicator).transform, window.serverSlider.getAnimations({subtree:true}).filter(a => a.playState === 'running').length, performance.now()]);
                if (hydratedAt !== undefined && performance.now() - hydratedAt >= 250) resolve({samples, hydratedAt});
                else requestAnimationFrame(sample);
              };
              sample();
            });
          </script><script type="module">${client}</script>`);
          await page.waitForFunction(
            () => (window as any).hydrated === true,
            undefined,
            { timeout: 5000 },
          );
          const control = page.getByRole('slider', { name: 'Hydrated slider' });
          await expect
            .poll(() => control.getAttribute('data-udx-slider-motion-reduce'))
            .toBe(reducedMotion === 'reduce' ? '' : null);
          expect(
            await page.evaluate(() => ({
              same:
                document.querySelector('[role=slider]') ===
                (window as any).serverSlider,
              nodes:
                [...(window as any).serverSlider.querySelectorAll('*')].every(
                  (node, i) => node === (window as any).serverNodes[i],
                ) &&
                (window as any).serverSlider.querySelectorAll('*').length ===
                  (window as any).serverNodes.length,
              before: (window as any).before,
              errors: (window as any).hydrationErrors,
            })),
          ).toEqual({
            same: true,
            nodes: true,
            before: {
              min: '0',
              max: '100',
              now: '20',
              text: '20',
              transform: 'scale(0)',
            },
            errors: [],
          });
          expect(
            await Promise.all(
              [
                'aria-valuemin',
                'aria-valuemax',
                'aria-valuenow',
                'aria-valuetext',
              ].map((attr) => control.getAttribute(attr)),
            ),
          ).toEqual(['0', '100', '20', '20']);
          const { samples, hydratedAt } = await page.evaluate(
            () => (window as any).samples,
          );
          expect(samples.length).toBeGreaterThan(1);
          expect(samples[0][2]).toBeLessThanOrEqual(hydratedAt);
          expect(
            samples[samples.length - 1][2] - hydratedAt,
          ).toBeGreaterThanOrEqual(250);
          expect(
            samples.every(
              ([transform, animations]: [string, number]) =>
                transform === 'matrix(0, 0, 0, 0, 0, 0)' && animations === 0,
            ),
          ).toBe(true);
          expect(
            await page.evaluate(() => (window as any).startedAnimations.length),
          ).toBe(0);
          await control.focus();
          await page.keyboard.press('ArrowRight');
          await expect
            .poll(() => control.getAttribute('aria-valuenow'))
            .toBe('30');
          expect(await control.getAttribute('aria-valuetext')).toBe('30');
          expect(
            await page.evaluate(() => [
              (window as any).policyMediaListeners.size,
              (window as any).policyObservers.size,
            ]),
          ).toEqual([1, 1]);
          await page.evaluate(() => (window as any).dispose());
          await expect
            .poll(() =>
              page.evaluate(() => [
                (window as any).policyMediaListeners.size,
                (window as any).policyObservers.size,
              ]),
            )
            .toEqual([0, 0]);
          expect(errors).toEqual([]);
        } finally {
          await browser.close();
        }
      }, 30000);
    }
  });
}
