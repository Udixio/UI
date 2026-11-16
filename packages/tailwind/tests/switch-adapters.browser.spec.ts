import { generateDocTheme } from './doc-theme';
import { compile } from '@tailwindcss/node';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { angularJitApplicationTransform } from '@angular/compiler-cli';
import { chromium, firefox, webkit } from 'playwright';
import { build as viteBuild, type Plugin } from 'vite';
import { beforeAll, describe, expect, it } from 'vitest';
import ts from 'typescript';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { motionBrowsers } from './motion-browsers.mjs';
import { switchStyle } from '../../core/src/lib/styles/switch.style';

const root = resolve(__dirname, '../../..');
const pages: Record<string, string> = {};

beforeAll(async () => {
  const classes = [false, true].flatMap((isChecked) =>
    Object.values(
      switchStyle({ isChecked } as Parameters<typeof switchStyle>[0]),
    ).flatMap((value) => value.split(/\s+/)),
  );
  const theme = await generateDocTheme();
  const { build } = await compile(`@import "tailwindcss";\n${theme}`, {
    base: resolve(root, 'apps/doc'),
    onDependency: () => {},
  });
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
  for (const framework of ['react', 'angular', 'svelte']) {
    const entry = resolve(
      root,
      `packages/ui-${framework}/tests/fixtures/switch-motion.${framework === 'react' ? 'tsx' : 'ts'}`,
    );
    const plugins: Plugin[] = [];
    if (framework === 'svelte')
      plugins.push(...([svelte({ configFile: false })].flat() as Plugin[]));
    if (framework === 'angular') {
      const program = ts.createProgram([entry], {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        experimentalDecorators: true,
        customConditions: ['development'],
        skipLibCheck: true,
      });
      plugins.push({
        name: 'angular-jit-decorators',
        enforce: 'pre',
        transform(_code, id) {
          if (!id.includes('/packages/ui-angular/') || !id.endsWith('.ts'))
            return;
          const source = program.getSourceFile(id);
          if (!source) throw new Error(`Missing Angular source: ${id}`);
          let output = '';
          program.emit(
            source,
            (name, text) => {
              if (name.endsWith('.js')) output = text;
            },
            undefined,
            false,
            { before: [angularJitApplicationTransform(program)] },
          );
          return output;
        },
      });
    }
    const result = await viteBuild({
      configFile: false,
      root,
      logLevel: 'error',
      define: { 'process.env.NODE_ENV': JSON.stringify('production') },
      resolve: {
        conditions:
          framework === 'svelte' ? ['browser', 'development'] : ['development'],
      },
      oxc: { jsx: { runtime: 'automatic', development: false } },
      plugins,
      build: {
        write: false,
        minify: false,
        lib: { entry, formats: ['es'] },
        rollupOptions: { output: { codeSplitting: false } },
      },
    });
    const chunk = (Array.isArray(result) ? result[0] : result).output.find(
      (item) => item.type === 'chunk',
    );
    if (!chunk || chunk.type !== 'chunk')
      throw new Error(`${framework} bundle missing`);
    const host =
      framework === 'angular'
        ? '<switch-motion-fixture></switch-motion-fixture>'
        : '<div id="root"></div>';
    pages[framework] =
      `<html><head><style>${build(classes)}\n${motion}</style></head><body>${host}<script>
      window.policyObservers = new Set();
      window.policyMediaListeners = [];
      const mediaAdd = MediaQueryList.prototype.addEventListener;
      const mediaRemove = MediaQueryList.prototype.removeEventListener;
      const capture = options => typeof options === 'boolean' ? options : !!options?.capture;
      const policyQuery = media => media.replace(/\\s+/g, '') === '(prefers-reduced-motion:reduce)';
      MediaQueryList.prototype.addEventListener = function(type, listener, options) {
        const useCapture = capture(options);
        if (type === 'change' && listener && policyQuery(this.media) && !window.policyMediaListeners.some(entry => entry.target === this && entry.listener === listener && entry.capture === useCapture)) window.policyMediaListeners.push({ target: this, listener, capture: useCapture });
        return mediaAdd.call(this, type, listener, options);
      };
      MediaQueryList.prototype.removeEventListener = function(type, listener, options) {
        const useCapture = capture(options);
        if (type === 'change' && policyQuery(this.media)) window.policyMediaListeners = window.policyMediaListeners.filter(entry => !(entry.target === this && entry.listener === listener && entry.capture === useCapture));
        return mediaRemove.call(this, type, listener, options);
      };
      const observe = MutationObserver.prototype.observe;
      const disconnect = MutationObserver.prototype.disconnect;
      MutationObserver.prototype.observe = function(target, options) {
        if (target === document.documentElement && options.attributeFilter?.includes('data-motion-policy')) window.policyObservers.add(this);
        return observe.call(this, target, options);
      };
      MutationObserver.prototype.disconnect = function() { window.policyObservers.delete(this); return disconnect.call(this); };
      </script><script type="module">${chunk.code.replace(/<\/script/gi, '<\\/script')}</script></body></html>`;
  }
}, 60000);

for (const name of motionBrowsers(process.env.MOTION_BROWSERS)) {
  const engine = { chromium, firefox, webkit }[
    name as 'chromium' | 'firefox' | 'webkit'
  ];
  for (const framework of ['react', 'angular', 'svelte'])
    describe(`${framework} Switch in ${name}`, () => {
      it('honors reduced motion at mount and during movement, keyboard and disabled state', async () => {
        const browser = await engine.launch();
        try {
          const page = await browser.newPage({ reducedMotion: 'reduce' });
          const errors: string[] = [];
          page.on('pageerror', (error) => errors.push(error.message));
          await page.setContent(pages[framework]);
          const enabled = page.getByRole('switch', { name: 'Enabled' });
          const disabled = page.getByRole('switch', { name: 'Disabled' });
          await enabled.waitFor({ state: 'attached' });
          const thumb = enabled.locator(':scope > div').first();
          await expect
            .poll(() => thumb.getAttribute('data-udx-switch-motion-reduce'))
            .toBe('');
          await page.keyboard.press('Tab');
          expect(
            await enabled.evaluate((el) => el === document.activeElement),
          ).toBe(true);
          await page.keyboard.press('Space');
          await expect
            .poll(() => enabled.getAttribute('aria-checked'))
            .toBe('true');
          await expect
            .poll(() =>
              thumb.evaluate((el) => (el as HTMLElement).style.translate),
            )
            .toBe('20px');
          expect(await disabled.getAttribute('tabindex')).toBe('-1');
          await disabled.dispatchEvent('click');
          await disabled.dispatchEvent('keydown', { key: ' ' });
          await disabled.dispatchEvent('keydown', { key: 'Enter' });
          await page.keyboard.press('Tab');
          expect(
            await disabled.evaluate((el) => el === document.activeElement),
          ).toBe(false);
          await page.keyboard.press('Shift+Tab');
          expect(
            await enabled.evaluate((el) => el === document.activeElement),
          ).toBe(true);
          expect(await disabled.getAttribute('aria-checked')).toBe('false');
          await page.emulateMedia({ reducedMotion: 'no-preference' });
          await expect
            .poll(() => thumb.getAttribute('data-udx-switch-motion-reduce'))
            .toBe(null);
          await page.keyboard.press('Enter');
          await expect
            .poll(() => enabled.getAttribute('aria-checked'))
            .toBe('false');
          // Observe the start before applying reduction, rather than waiting for the 150ms tween.
          await expect
            .poll(
              () =>
                thumb.evaluate((el) => {
                  // The slide is a WAAPI motion: the thumb shows the computed translate, while its inline one changes at the end.
                  const value = parseFloat(getComputedStyle(el).translate);
                  return value > 0 && value < 20;
                }),
              { interval: 10 },
            )
            .toBe(true);
          await page.emulateMedia({ reducedMotion: 'reduce' });
          await expect
            .poll(() =>
              thumb.evaluate((el) => (el as HTMLElement).style.translate),
            )
            .toBe('0px');
          await page.waitForTimeout(200);
          expect(
            await thumb.evaluate((el) => (el as HTMLElement).style.translate),
          ).toBe('0px');
          expect(await page.evaluate(() => (window as any).changes)).toEqual([
            true,
            false,
          ]);
          const events = await page.evaluate(
            () => (window as any).events as [string, boolean, boolean][],
          );
          for (const key of [' ', 'Enter']) {
            const event = events.find((item) => item[0] === key);
            expect(event).toEqual([key, true, framework !== 'angular']);
          }
          const mediaListenersBeforeDispose = await page.evaluate(
            () => (window as any).policyMediaListeners.length as number,
          );
          expect(mediaListenersBeforeDispose).toBe(1);
          expect(
            await page.evaluate(() => (window as any).policyObservers.size),
          ).toBe(1);
          await thumb.evaluate((el) => {
            (window as any).detachedThumb = el;
          });
          await page.waitForFunction(
            () => typeof (window as any).dispose === 'function',
          );
          await page.evaluate(async () => {
            await (window as any).dispose();
          });
          expect(
            await page.evaluate(
              () => (window as any).detachedThumb.isConnected,
            ),
          ).toBe(false);
          expect(
            await page.evaluate(() => (window as any).policyObservers.size),
          ).toBe(0);
          expect(
            await page.evaluate(() =>
              (window as any).detachedThumb.hasAttribute(
                'data-udx-switch-motion-reduce',
              ),
            ),
          ).toBe(false);
          expect(
            await page.evaluate(
              () => (window as any).policyMediaListeners.length,
            ),
          ).toBe(0);
          await page.evaluate(() => {
            (window as any).probeChanges = 0;
            matchMedia('(prefers-reduced-motion: reduce)').addEventListener(
              'change',
              () => (window as any).probeChanges++,
            );
          });
          await page.emulateMedia({ reducedMotion: 'no-preference' });
          await expect
            .poll(() => page.evaluate(() => (window as any).probeChanges))
            .toBe(1);
          await page.emulateMedia({ reducedMotion: 'reduce' });
          await expect
            .poll(() => page.evaluate(() => (window as any).probeChanges))
            .toBe(2);
          expect(
            await page.evaluate(() =>
              (window as any).detachedThumb.hasAttribute(
                'data-udx-switch-motion-reduce',
              ),
            ),
          ).toBe(false);
          expect(errors).toEqual([]);
        } finally {
          await browser.close();
        }
      }, 30000);
    });
}
