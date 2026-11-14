import { generateDocTheme } from './doc-theme';
import { motionBrowsers } from './motion-browsers.mjs';
import { compile } from '@tailwindcss/node';
import { chromium, firefox, webkit } from 'playwright';
import { build as viteBuild } from 'vite';
import { beforeAll, describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { angularJitApplicationTransform } from '@angular/compiler-cli';
// Exercise the current core source without adding a package dependency to Tailwind.
// eslint-disable-next-line @nx/enforce-module-boundaries
import { searchStyle } from '../../core/src/lib/styles/search.style';

const root = resolve(__dirname, '../../..');
let html: string;

beforeAll(async () => {
  const classes = [false, true].flatMap((isFocused) =>
    Object.values(
      searchStyle({
        label: 'Search',
        isFocused,
        isExpanded: false,
        hasQuery: true,
        hasResults: false,
        clearable: true,
      } as Parameters<typeof searchStyle>[0]),
    ).flatMap((value) => value.split(/\s+/)),
  );
  // This exercises the documentation theme configuration, not every consumer theme.
  const generatedTheme = await generateDocTheme();
  const { build } = await compile(`@import "tailwindcss";\n${generatedTheme}`, {
    base: resolve(root, 'apps/doc'),
    onDependency: () => { /* No dependency tracking is needed for this test. */ },
  });
  // Flatten source imports for setContent; package export and import resolution are tested separately.
  const motion = [
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
  const angularProgram = ts.createProgram(
    [resolve(root, 'packages/ui-angular/tests/fixtures/search-motion.ts')],
    {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      experimentalDecorators: true,
      customConditions: ['development'],
      skipLibCheck: true,
    },
  );
  const result = await viteBuild({
    configFile: false,
    root,
    logLevel: 'error',
    define: { 'process.env.NODE_ENV': JSON.stringify('production') },
    resolve: { conditions: ['development'] },
    plugins: [
      {
        name: 'angular-jit-decorators',
        enforce: 'pre',
        transform(code, id) {
          if (!id.includes('/packages/ui-angular/') || !id.endsWith('.ts'))
            return;
          const source = angularProgram.getSourceFile(id);
          if (!source) throw new Error(`Missing Angular source: ${id}`);
          let output = '';
          angularProgram.emit(
            source,
            (name, text) => {
              if (name.endsWith('.js')) output = text;
            },
            undefined,
            false,
            { before: [angularJitApplicationTransform(angularProgram)] },
          );
          return output;
        },
      },
    ],
    build: {
      write: false,
      minify: false,
      lib: {
        entry: resolve(
          root,
          'packages/ui-angular/tests/fixtures/search-motion.ts',
        ),
        formats: ['es'],
      },
      rollupOptions: { output: { codeSplitting: false } },
    },
  });
  const bundle = (Array.isArray(result) ? result[0] : result).output.find(
    (item) => item.type === 'chunk',
  );
  if (!bundle || bundle.type !== 'chunk')
    throw new Error('Search fixture bundle missing');
  html = `<html><head><style>${build(classes)}\n${motion}</style></head><body><search-motion-fixture></search-motion-fixture><script type="module">${bundle.code.replace(/<\/script/gi, '<\\/script')}</script></body></html>`;
}, 30000);

for (const name of motionBrowsers(process.env.MOTION_BROWSERS)) {
  const engine = { chromium, firefox, webkit }[name as 'chromium' | 'firefox' | 'webkit'];
  describe(`Angular Search in ${name}`, () => {
    it('moves focus and animates its real outline, respects reduced motion and disabled controls', async () => {
      const browser = await engine.launch();
      let cleanupPage: Awaited<ReturnType<typeof browser.newPage>> | undefined;
      let testFailed = false;
      let testError: unknown;
      let cleanupError: unknown;
      try {
        const page = await browser.newPage({ reducedMotion: 'no-preference' });
        cleanupPage = page;
        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));
        page.on('console', (message) => {
          if (message.type() === 'error') errors.push(message.text());
        });
        await page.setContent(html);
        const input = page.locator('input[aria-label="Search"]');
        const clear = page
          .getByRole('search')
          .first()
          .getByRole('button', { name: 'Clear search' });
        const container = page
          .getByRole('search')
          .first()
          .locator('.container');
        await input.waitFor({ state: 'attached', timeout: 4000 }).catch(() => {
          throw new Error(`Search did not mount: ${errors.join('; ')}`);
        });
        for (const [element, key] of [
          [container, 'container'],
          [clear, 'clear'],
        ] as const) {
          await element.evaluate((el, name) => {
            const counts = ((window as any).transitions ??= {
              container: [],
              clear: [],
            });
            el.addEventListener('transitionrun', (event) => {
              if (event.target === el)
                counts[name].push((event as TransitionEvent).propertyName);
            });
          }, key);
        }
        expect(
          await container.evaluate((el) => ({
            duration: getComputedStyle(el).transitionDuration,
            durationToken: getComputedStyle(el)
              .getPropertyValue('--udx-motion-duration-short4')
              .trim(),
            easing: getComputedStyle(el).transitionTimingFunction,
            token: getComputedStyle(el)
              .getPropertyValue('--udx-motion-easing-standard-decelerate')
              .trim(),
            scale: getComputedStyle(el)
              .getPropertyValue('--udx-motion-scale')
              .trim(),
          })),
        ).toEqual({
          duration: '0.2s',
          durationToken: '0.2s',
          easing: 'cubic-bezier(0, 0, 0, 1)',
          token: 'cubic-bezier(0, 0, 0, 1)',
          scale: '1',
        });
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');
        expect(
          await input.evaluate((el) => el === document.activeElement),
        ).toBe(true);
        await expect
          .poll(() =>
            page.evaluate(() => (window as any).transitions.container),
          )
          .toContain('outline-color');
        await expect
          .poll(() =>
            container.evaluate((el) => getComputedStyle(el).outlineColor),
          )
          .toBe('rgb(73, 66, 90)');
        await page.keyboard.press('Tab');
        expect(await clear.evaluate((el) => el.matches(':focus-visible'))).toBe(
          true,
        );
        await expect
          .poll(() => page.evaluate(() => (window as any).transitions.clear))
          .toContain('outline-color');
        await expect
          .poll(() =>
            container.evaluate((el) => getComputedStyle(el).outlineColor),
          )
          .toBe('rgba(0, 0, 0, 0)');
        await expect
          .poll(() => clear.evaluate((el) => getComputedStyle(el).outlineColor))
          .toBe('rgb(73, 66, 90)');
        const exerciseReducedFocus = async () => {
          await page.evaluate(() => {
            (window as any).transitions.container.length = 0;
            (window as any).transitions.clear.length = 0;
          });
          await page.keyboard.press('Shift+Tab');
          expect(
            await input.evaluate((el) => el === document.activeElement),
          ).toBe(true);
          await expect
            .poll(() =>
              container.evaluate((el) => getComputedStyle(el).outlineColor),
            )
            .toBe('rgb(73, 66, 90)');
          await page.keyboard.press('Tab');
          expect(
            await clear.evaluate((el) => el.matches(':focus-visible')),
          ).toBe(true);
          await expect
            .poll(() =>
              container.evaluate((el) => getComputedStyle(el).outlineColor),
            )
            .toBe('rgba(0, 0, 0, 0)');
          expect(
            await clear.evaluate((el) => getComputedStyle(el).outlineColor),
          ).toBe('rgb(73, 66, 90)');
          await page.waitForTimeout(50);
          expect(
            await page.evaluate(() => (window as any).transitions),
          ).toEqual({ container: [], clear: [] });
        };
        await page.emulateMedia({ reducedMotion: 'reduce' });
        expect(
          await container.evaluate(
            (el) => getComputedStyle(el).transitionProperty,
          ),
        ).toBe('none');
        expect(
          await clear.evaluate((el) => getComputedStyle(el).transitionProperty),
        ).toBe('none');
        await exerciseReducedFocus();
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        await page.evaluate(() =>
          document.documentElement.setAttribute('data-motion-policy', 'reduce'),
        );
        expect(
          await container.evaluate(
            (el) => getComputedStyle(el).transitionProperty,
          ),
        ).toBe('none');
        expect(
          await clear.evaluate((el) => getComputedStyle(el).transitionProperty),
        ).toBe('none');
        await exerciseReducedFocus();
        await page.keyboard.press('Space');
        await expect.poll(() => input.inputValue()).toBe('');
        expect(
          await input.evaluate((el) => el === document.activeElement),
        ).toBe(true);
        await expect.poll(() => clear.count()).toBe(0);
        expect(
          await page
            .getByRole('searchbox', { name: 'Disabled search' })
            .isDisabled(),
        ).toBe(true);
        expect(
          await page
            .getByRole('button', { name: 'Clear search', disabled: true })
            .isDisabled(),
        ).toBe(true);
        for (let i = 0; i < 5; i++) {
          await page.keyboard.press('Tab');
          expect(
            await page.evaluate(() => {
              const active = document.activeElement;
              return active instanceof HTMLInputElement ||
                active instanceof HTMLButtonElement
                ? active.disabled
                : false;
            }),
          ).toBe(false);
        }
        await page.waitForFunction(() =>
          Boolean((window as any).searchMotionApp),
        );
        expect(
          await page.evaluate(() => {
            const app = (window as any).searchMotionApp;
            app.destroy();
            return app.destroyed;
          }),
        ).toBe(true);
        expect(await page.locator('input[aria-label="Search"]').count()).toBe(
          0,
        );
        expect(errors).toEqual([]);
      } catch (error) {
        testFailed = true;
        testError = error;
      } finally {
        try {
          await cleanupPage?.evaluate(() => {
            const app = (window as any).searchMotionApp;
            if (app && !app.destroyed) app.destroy();
          });
        } catch (error) {
          cleanupError = error;
        } finally {
          try {
            await browser.close();
          } catch (error) {
            cleanupError ??= error;
          }
        }
      }
      if (testFailed) throw testError;
      if (cleanupError) throw cleanupError;
    }, 30000);
  });
}
