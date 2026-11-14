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
import { generateDocTheme } from './doc-theme';
import { sliderStyle } from '../../core/src/lib/styles/slider.style';

const root = resolve(__dirname, '../../..');
const pages: Record<string, string> = {};

beforeAll(async () => {
  const classes = [false, true].flatMap((isChanging) =>
    Object.values(
      sliderStyle({ isChanging } as Parameters<typeof sliderStyle>[0]),
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
      `packages/ui-${framework}/tests/fixtures/slider-motion.${framework === 'react' ? 'tsx' : 'ts'}`,
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
        ? '<slider-motion-fixture></slider-motion-fixture>'
        : '<div id="root"></div>';
    pages[framework] =
      `<html><head><style>${build(classes)}\n${motion}</style></head><body>${host}<script>
      // Keep native WAAPI running, but stretch indicator animations so a slow
      // browser/CI roundtrip cannot finish the 100ms tween before interruption.
      const nativeAnimate = Element.prototype.animate;
      Element.prototype.animate = function(keyframes, options) {
        if (this.parentElement?.parentElement?.parentElement?.getAttribute('role') === 'slider' && options && typeof options === 'object') {
          options = { ...options, duration: 10000 };
        }
        return nativeAnimate.call(this, keyframes, options);
      };
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
  const engine = { chromium, firefox, webkit }[name as 'chromium' | 'firefox' | 'webkit'];
  for (const framework of ['react', 'angular', 'svelte'])
    describe(`${framework} Slider in ${name}`, () => {
      it('supports keyboard range changes, reduced motion and cleanup across instances', async () => {
        const browser = await engine.launch();
        try {
          const page = await browser.newPage({ reducedMotion: 'reduce' });
          page.setDefaultTimeout(5000);
          const errors: string[] = [];
          page.on('pageerror', error => errors.push(error.message));
          await page.setContent(pages[framework]);
          const enabled = page.getByRole('slider', { name: 'Enabled' });
          const other = page.getByRole('slider', { name: 'Other' });
          const disabled = page.getByRole('slider', { name: 'Disabled' });
          await enabled.waitFor({ state: 'attached' }).catch(error => { throw new Error(`${error.message} Page errors: ${errors.join('; ')}`); });
          await expect.poll(() => enabled.getAttribute('data-udx-slider-motion-reduce')).toBe('');
          await expect.poll(() => other.getAttribute('data-udx-slider-motion-reduce')).toBe('');
          expect(await enabled.getAttribute('aria-valuemin')).toBe('0');
          expect(await enabled.getAttribute('aria-valuemax')).toBe('100');
          expect(await enabled.getAttribute('aria-valuenow')).toBe('20');
          await page.keyboard.press('Tab');
          expect(await enabled.evaluate(el => el === document.activeElement)).toBe(true);
          await page.keyboard.press('ArrowRight');
          await expect.poll(() => enabled.getAttribute('aria-valuenow')).toBe('30');
          expect(await enabled.getAttribute('aria-valuetext')).toBe('30');
          await page.keyboard.press('End');
          await expect.poll(() => enabled.getAttribute('aria-valuenow')).toBe('100');
          await page.keyboard.press('Home');
          await expect.poll(() => enabled.getAttribute('aria-valuenow')).toBe('0');
          expect(await other.getAttribute('aria-valuenow')).toBe('40');
          expect(await disabled.getAttribute('tabindex')).toBe('-1');
          expect(await disabled.getAttribute('aria-disabled')).toBe('true');
          await disabled.dispatchEvent('keydown', { key: 'ArrowRight' });
          expect(await disabled.getAttribute('aria-valuenow')).toBe('50');
          const indicator = enabled.locator(':scope > div:nth-of-type(2) > div > div');
          await expect.poll(() => indicator.evaluate(el => (el as HTMLElement).style.transform)).toBe('scale(1)');
          await page.emulateMedia({ reducedMotion: 'no-preference' });
          await expect.poll(() => enabled.getAttribute('data-udx-slider-motion-reduce')).toBe(null);
          await enabled.blur();
          await expect.poll(() => indicator.evaluate(el => el.getAnimations().length)).toBeGreaterThan(0);
          await indicator.evaluate(el => { (window as any).closingAnimation = el.getAnimations()[0]; });
          expect(await page.evaluate(() => (window as any).closingAnimation.effect.getTiming().duration)).toBe(10000);
          expect(await page.evaluate(() => (window as any).closingAnimation.effect.getKeyframes().at(-1).transform)).toBe('scale(0)');
          await enabled.focus();
          await page.keyboard.press('ArrowRight');
          await expect.poll(() => indicator.evaluate(el => {
            const previous = (window as any).closingAnimation as Animation;
            const current = el.getAnimations()[0];
            return previous.playState === 'idle' && !!current && current !== previous &&
              (current.effect as KeyframeEffect).getKeyframes().at(-1)?.transform === 'scale(1)';
          })).toBe(true);
          expect(await indicator.evaluate(el => (el.getAnimations()[0].effect as KeyframeEffect).getTiming().duration)).toBe(10000);
          await page.emulateMedia({ reducedMotion: 'reduce' });
          await expect.poll(() => enabled.getAttribute('data-udx-slider-motion-reduce')).toBe('');
          await expect.poll(() => indicator.evaluate(el => (el as HTMLElement).style.transform)).toBe('scale(1)');
          expect(await indicator.evaluate(el => el.getAnimations().length)).toBe(0);
          expect(await page.evaluate(() => (window as any).changes)).toEqual([30, 100, 0, 10]);
          await expect.poll(() => page.evaluate(() => (window as any).policyObservers.size)).toBe(1);
          await expect.poll(() => page.evaluate(() => (window as any).policyMediaListeners.length)).toBe(1);
          await page.emulateMedia({ reducedMotion: 'no-preference' });
          await expect.poll(() => enabled.getAttribute('data-udx-slider-motion-reduce')).toBe(null);
          await enabled.blur();
          await expect.poll(() => indicator.evaluate(el => el.getAnimations().length)).toBeGreaterThan(0);
          await indicator.evaluate(el => { (window as any).unmountAnimation = el.getAnimations()[0]; });
          expect(await page.evaluate(() => (window as any).unmountAnimation.effect.getTiming().duration)).toBe(10000);
          await enabled.evaluate(el => { (window as any).detachedSlider = el; });
          await page.waitForFunction(() => typeof (window as any).removeEnabled === 'function');
          await page.evaluate(() => (window as any).removeEnabled());
          await expect.poll(() => page.evaluate(() => (window as any).detachedSlider.isConnected)).toBe(false);
          expect(await page.evaluate(() => (window as any).detachedSlider.hasAttribute('data-udx-slider-motion-reduce'))).toBe(false);
          expect(await page.evaluate(() => (window as any).unmountAnimation.playState)).toBe('idle');
          expect(await page.evaluate(() => (window as any).policyObservers.size)).toBe(1);
          expect(await page.evaluate(() => (window as any).policyMediaListeners.length)).toBe(1);
          await page.emulateMedia({ reducedMotion: 'no-preference' });
          await expect.poll(() => other.getAttribute('data-udx-slider-motion-reduce')).toBe(null);
          await page.emulateMedia({ reducedMotion: 'reduce' });
          await expect.poll(() => other.getAttribute('data-udx-slider-motion-reduce')).toBe('');
          await page.waitForFunction(() => typeof (window as any).dispose === 'function');
          await page.evaluate(async () => { await (window as any).dispose(); });
          expect(await page.evaluate(() => (window as any).detachedSlider.isConnected)).toBe(false);
          expect(await page.evaluate(() => (window as any).detachedSlider.hasAttribute('data-udx-slider-motion-reduce'))).toBe(false);
          expect(await page.evaluate(() => (window as any).policyObservers.size)).toBe(0);
          expect(await page.evaluate(() => (window as any).policyMediaListeners.length)).toBe(0);
          expect(errors).toEqual([]);
        } finally { await browser.close(); }
      }, 30000);
    });
}
