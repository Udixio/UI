import { compile } from '@tailwindcss/node';
import { chromium, firefox, webkit } from 'playwright';
import { bundleController } from './test-support/bundle-controller';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { motionBrowsers } from './test-support/motion-browsers.mjs';
import { sliderStyle } from '../../core/src/lib/styles/slider.style';

const idle = sliderStyle({ isChanging: false } as Parameters<typeof sliderStyle>[0]);
const changing = sliderStyle({ isChanging: true } as Parameters<typeof sliderStyle>[0]);
for (const name of motionBrowsers(process.env.MOTION_BROWSERS)) {
  const engine = { chromium, firefox, webkit }[name as 'chromium' | 'firefox' | 'webkit'];
  describe(`Slider motion in ${name}`, () => {
    it('interpolates intermediate scales and keeps continuity on reversal', async () => {
      const script = await bundleController('slider');
      const browser = await engine.launch();
      try {
        const page = await browser.newPage({ reducedMotion: 'no-preference' });
        await page.setContent('<div id="root"><div id="indicator" style="transform:scale(0)"></div></div>');
        await page.addScriptTag({ content: script });
        await page.evaluate(() => {
          (window as any).controller = (window as any).SliderController.createSliderIndicatorController({ root: document.querySelector('#root'), indicator: document.querySelector('#indicator'), duration: 0.5 });
          (window as any).controller.setVisible(true);
        });
        const scale = () => page.locator('#indicator').evaluate(el => new DOMMatrixReadOnly(getComputedStyle(el).transform).a);
        await page.waitForTimeout(120);
        const first = await scale();
        await page.waitForTimeout(120);
        const second = await scale();
        expect(first).toBeGreaterThan(0);
        expect(second).toBeGreaterThan(first);
        expect(second).toBeLessThan(1);
        await page.evaluate(() => (window as any).controller.setVisible(false));
        const reversed = await scale();
        expect(Math.abs(reversed - second)).toBeLessThan(0.15);
        await page.waitForTimeout(120);
        const descending = await scale();
        expect(descending).toBeLessThan(reversed);
        expect(descending).toBeGreaterThan(0);
        await page.evaluate(() => (window as any).controller.destroy());
      } finally { await browser.close(); }
    });

    it('keeps the final hidden target after reversing an in-flight indicator', async () => {
      const script = await bundleController('slider');
      const browser = await engine.launch();
      try {
        const page = await browser.newPage({ reducedMotion: 'no-preference' });
        await page.setContent('<div id="root"><div id="indicator" style="transform:scale(0)"></div></div>');
        await page.addScriptTag({ content: script });
        await page.evaluate(() => {
          (window as any).controller = (window as any).SliderController.createSliderIndicatorController({ root: document.querySelector('#root'), indicator: document.querySelector('#indicator'), duration: 0.5 });
          (window as any).controller.setVisible(true);
        });
        await page.waitForTimeout(60);
        await page.evaluate(() => {
          (window as any).controller.setVisible(false);
          document.documentElement.setAttribute('data-motion-policy', 'reduce');
        });
        await expect.poll(() => page.locator('#root').evaluate(el => el.hasAttribute('data-udx-slider-motion-reduce'))).toBe(true);
        await page.waitForTimeout(700);
        expect(await page.locator('#indicator').evaluate(el => (el as HTMLElement).style.transform)).toBe('scale(0)');
        expect(await page.locator('#indicator').evaluate(el => el.getAnimations().length)).toBe(0);
        await page.evaluate(() => (window as any).controller.destroy());
      } finally { await browser.close(); }
    });

    it('interrupts tracks, handle and indicator in separate shadow roots', async () => {
      const { build } = await compile('@import "tailwindcss";', { base: resolve(__dirname, '..'), onDependency: () => {} });
      const css = build([idle.slider, idle.activeTrack, idle.inactiveTrack, idle.handle, changing.handle].flatMap(x => x.split(/\s+/)));
      const script = await bundleController('slider');
      const browser = await engine.launch();
      try {
        const page = await browser.newPage({ reducedMotion: 'no-preference' });
        await page.setContent('<div id="one"></div><div id="two"></div>');
        await page.addScriptTag({ content: script });
        await page.evaluate(({ css, idle }) => {
          const api = (window as any).SliderController;
          (window as any).controllers = ['one', 'two'].map(id => {
            const shadow = document.getElementById(id)!.attachShadow({ mode: 'open' });
            shadow.innerHTML = `<style>${css}</style><div id="root" class="${idle.slider}" style="width:300px;--udx-motion-scale:10"><div id="active" class="${idle.activeTrack}" style="flex:.2"></div><div id="handle" class="${idle.handle}"></div><div id="inactive" class="${idle.inactiveTrack}" style="flex:.8"></div><div id="indicator" style="transform:scale(0)"></div></div>`;
            return api.createSliderIndicatorController({ root: shadow.querySelector('#root'), indicator: shadow.querySelector('#indicator'), duration: 0.5 });
          });
        }, { css, idle });
        const root = page.locator('#one').locator('#root');
        const handle = page.locator('#one').locator('#handle');
        const active = page.locator('#one').locator('#active');
        await page.evaluate(({ cls }) => {
          const shadow = document.getElementById('one')!.shadowRoot!;
          void (shadow.querySelector('#handle') as HTMLElement).offsetWidth;
          (shadow.querySelector('#active') as HTMLElement).style.flex = '.8';
          shadow.querySelector('#handle')!.className = cls;
          (window as any).controllers[0].setVisible(true);
        }, { cls: changing.handle });
        await page.waitForTimeout(50);
        expect(await handle.evaluate(el => el.getAnimations().length)).toBeGreaterThan(0);
        expect(await active.evaluate(el => el.getAnimations().length)).toBeGreaterThan(0);
        await page.evaluate(() => document.documentElement.setAttribute('data-motion-policy', 'reduce'));
        await expect.poll(() => root.evaluate(el => el.hasAttribute('data-udx-slider-motion-reduce'))).toBe(true);
        expect(await handle.evaluate(el => getComputedStyle(el).transitionProperty)).toBe('none');
        expect(await active.evaluate(el => el.getAnimations().length)).toBe(0);
        expect(await handle.evaluate(el => el.getAnimations().length)).toBe(0);
        expect(await page.locator('#one').locator('#indicator').evaluate(el => (el as HTMLElement).style.transform)).toBe('scale(1)');
        await page.waitForTimeout(150);
        expect(await page.locator('#one').locator('#indicator').evaluate(el => (el as HTMLElement).style.transform)).toBe('scale(1)');
        expect(await page.locator('#two').locator('#root').evaluate(el => el.hasAttribute('data-udx-slider-motion-reduce'))).toBe(true);
        await page.evaluate(() => document.documentElement.removeAttribute('data-motion-policy'));
        await expect.poll(() => root.evaluate(el => el.hasAttribute('data-udx-slider-motion-reduce'))).toBe(false);
        await page.evaluate(() => (window as any).controllers[0].setVisible(false));
        await page.waitForTimeout(20);
        await page.evaluate(() => (window as any).controllers[0].setVisible(true));
        await page.waitForTimeout(20);
        await page.evaluate(() => (window as any).controllers[0].setVisible(false));
        await page.waitForTimeout(20);
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await expect.poll(() => root.evaluate(el => el.hasAttribute('data-udx-slider-motion-reduce'))).toBe(true);
        expect(await page.locator('#one').locator('#indicator').evaluate(el => (el as HTMLElement).style.transform)).toBe('scale(0)');
        await page.waitForTimeout(700);
        expect(await page.locator('#one').locator('#indicator').evaluate(el => (el as HTMLElement).style.transform)).toBe('scale(0)');
        await page.evaluate(() => (window as any).controllers[0].destroy());
        expect(await root.evaluate(el => el.hasAttribute('data-udx-slider-motion-reduce'))).toBe(false);
        expect(await page.locator('#two').locator('#root').evaluate(el => el.hasAttribute('data-udx-slider-motion-reduce'))).toBe(true);
        await page.evaluate(() => (window as any).controllers[1].destroy());
      } finally { await browser.close(); }
    });
  });
}
