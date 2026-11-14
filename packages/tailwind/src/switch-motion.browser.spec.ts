import { compile } from '@tailwindcss/node';
import { chromium, firefox, webkit } from 'playwright';
import { bundleController } from './test-support/bundle-controller';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { motionBrowsers } from './test-support/motion-browsers.mjs';
import { switchStyle } from '../../core/src/lib/styles/switch.style';

const unchecked = switchStyle({ isChecked: false } as Parameters<typeof switchStyle>[0]);
const checked = switchStyle({ isChecked: true } as Parameters<typeof switchStyle>[0]);
for (const name of motionBrowsers(process.env.MOTION_BROWSERS)) {
  const engine = { chromium, firefox, webkit }[name as 'chromium' | 'firefox' | 'webkit'];
  describe(`Switch size motion in ${name}`, () => {
    it('settles real thumb controllers when reduction changes during movement', async () => {
      const result = await bundleController('switch');
      const browser = await engine.launch();
      try {
        const page = await browser.newPage({ reducedMotion: 'no-preference' });
        await page.setContent('<div id="a" style="translate: 0px"></div><div id="b" style="translate: 0px"></div>');
        await page.addScriptTag({ content: result });
        await page.evaluate(() => {
          const factory = (window as unknown as { SwitchController: { createSwitchThumbController: (options: { root: HTMLElement }) => { update: (from: number, to: number) => void; destroy: () => void } } }).SwitchController;
          const a = factory.createSwitchThumbController({ root: document.querySelector('#a')! });
          const b = factory.createSwitchThumbController({ root: document.querySelector('#b')! });
          (window as unknown as { controllers: typeof a[] }).controllers = [a, b];
          a.update(0, 20); b.update(0, 30);
        });
        await page.waitForTimeout(40);
        await page.evaluate(() => document.documentElement.setAttribute('data-motion-policy', 'reduce'));
        await expect.poll(() => page.locator('#a').evaluate(el => (el as HTMLElement).style.translate)).toBe('20px');
        expect(await page.locator('#b').evaluate(el => (el as HTMLElement).style.translate)).toBe('30px');
        await page.waitForTimeout(200);
        expect(await page.locator('#a').evaluate(el => (el as HTMLElement).style.translate)).toBe('20px');
        await page.evaluate(() => document.documentElement.removeAttribute('data-motion-policy'));
        await page.waitForTimeout(20);
        await page.evaluate(() => {
          const controllers = (window as unknown as { controllers: { update: (from: number, to: number) => void }[] }).controllers;
          controllers[0].update(20, 0);
          controllers[0].update(0, 20);
          controllers[0].update(20, 0);
        });
        await page.waitForTimeout(30);
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await expect.poll(() => page.locator('#a').evaluate(el => (el as HTMLElement).style.translate)).toBe('0px');
        await page.waitForTimeout(200);
        expect(await page.locator('#a').evaluate(el => (el as HTMLElement).style.translate)).toBe('0px');
        await page.evaluate(() => {
          const controllers = (window as unknown as { controllers: { update: (from: number, to: number) => void; destroy: () => void }[] }).controllers;
          controllers[1].update(30, 0);
          for (const controller of controllers) controller.destroy();
        });
        expect(await page.locator('#b').evaluate(el => (el as HTMLElement).style.translate)).toBe('0px');
      } finally { await browser.close(); }
    });

    it('interrupts a shadow thumb transition from the document policy without motion.css', async () => {
      const { build } = await compile('@import "tailwindcss";', { base: resolve(__dirname, '..'), onDependency: () => {} });
      const css = build([...unchecked.handle.split(/\s+/), ...checked.handle.split(/\s+/)]);
      const script = await bundleController('switch');
      const browser = await engine.launch();
      try {
        const page = await browser.newPage({ reducedMotion: 'no-preference' });
        await page.setContent('<div id="host"></div>');
        await page.addScriptTag({ content: script });
        await page.evaluate(({ css, cls }) => {
          const shadow = document.querySelector('#host')!.attachShadow({ mode: 'open' });
          shadow.innerHTML = `<style>${css}</style><div id="container"><div id="handle" class="${cls}" style="--udx-motion-scale:10"></div></div>`;
          const api = (window as unknown as { SwitchController: { createSwitchThumbController: (options: { root: HTMLElement }) => unknown } }).SwitchController;
          (window as unknown as { controller: unknown }).controller = api.createSwitchThumbController({ root: shadow.querySelector('#container')! });
        }, { css, cls: unchecked.handle });
        const handle = page.locator('#host').locator('#handle');
        await handle.evaluate((el, cls) => { el.className = cls; }, checked.handle);
        await page.waitForTimeout(50);
        expect(await handle.evaluate(el => el.getAnimations().length)).toBeGreaterThan(0);
        await page.evaluate(() => document.documentElement.setAttribute('data-motion-policy', 'reduce'));
        await expect.poll(() => handle.evaluate(el => getComputedStyle(el).transitionProperty)).toBe('none');
        expect(await handle.evaluate(el => el.getAnimations().length)).toBe(0);
        expect(await handle.evaluate(el => getComputedStyle(el).width)).toBe('24px');
        await page.evaluate(() => document.documentElement.removeAttribute('data-motion-policy'));
        await expect.poll(() => handle.evaluate(el => getComputedStyle(el).transitionProperty)).toBe('width, height');
        await page.evaluate(() => (window as unknown as { controller: { destroy: () => void } }).controller.destroy());
      } finally { await browser.close(); }
    });

    it('inherits document scale in Shadow DOM while respecting local overrides', async () => {
      const { build } = await compile('@import "tailwindcss";', { base: resolve(__dirname, '..'), onDependency: () => {} });
      const css = build(unchecked.handle.split(/\s+/));
      const motionCss = readFileSync(resolve(__dirname, '../../motion/public/motion.css'), 'utf8');
      const browser = await engine.launch();
      try {
        const page = await browser.newPage({ reducedMotion: 'no-preference' });
        await page.setContent('<div id="host"></div>');
        await page.evaluate(({ css, cls }) => {
          document.documentElement.setAttribute('data-motion-policy', 'reduce');
          const shadow = document.querySelector('#host')!.attachShadow({ mode: 'open' });
          shadow.innerHTML = `<style>${css}</style><div id="handle" class="${cls}"></div>`;
        }, { css, cls: unchecked.handle });
        const handle = page.locator('#host').locator('#handle');
        expect(await handle.evaluate(el => getComputedStyle(el).transitionDuration)).toBe('0.1s');
        await page.addStyleTag({ content: motionCss });
        expect(await handle.evaluate(el => getComputedStyle(el).transitionDuration)).toBe('0s');
        await handle.evaluate(el => (el as HTMLElement).style.setProperty('--udx-motion-scale', '0.5'));
        expect(await handle.evaluate(el => getComputedStyle(el).transitionDuration)).toBe('0.05s');
        await page.emulateMedia({ reducedMotion: 'reduce' });
        expect(await handle.evaluate(el => getComputedStyle(el).transitionProperty)).toBe('none');
      } finally { await browser.close(); }
    });

    it('uses the scaled duration and interrupts a live transition on reduction', async () => {
      const { build } = await compile('@import "tailwindcss";', { base: resolve(__dirname, '..'), onDependency: () => {} });
      const css = build([...unchecked.handle.split(/\s+/), ...checked.handle.split(/\s+/)]);
      const browser = await engine.launch();
      try {
        const page = await browser.newPage({ reducedMotion: 'no-preference' });
        await page.setContent(`<style>${css}</style><div id="handle" class="${unchecked.handle}"></div>`);
        const handle = page.locator('#handle');
        expect(await handle.evaluate(el => getComputedStyle(el).transitionDuration)).toBe('0.1s');
        await handle.evaluate(el => (el as HTMLElement).style.setProperty('--udx-motion-scale', '0.5'));
        expect(await handle.evaluate(el => getComputedStyle(el).transitionDuration)).toBe('0.05s');
        await handle.evaluate(el => (el as HTMLElement).style.setProperty('--udx-motion-scale', '10'));
        await handle.evaluate((el, cls) => { el.className = cls; }, checked.handle);
        await page.waitForTimeout(50);
        expect(await handle.evaluate(el => el.getAnimations().length)).toBeGreaterThan(0);
        await page.evaluate(() => document.documentElement.setAttribute('data-motion-policy', 'reduce'));
        expect(await handle.evaluate(el => getComputedStyle(el).transitionProperty)).toBe('none');
        expect(await handle.evaluate(el => el.getAnimations().length)).toBe(0);
        expect(await handle.evaluate(el => getComputedStyle(el).width)).toBe('24px');
        await page.evaluate(() => document.documentElement.removeAttribute('data-motion-policy'));
        await page.emulateMedia({ reducedMotion: 'reduce' });
        expect(await handle.evaluate(el => getComputedStyle(el).transitionProperty)).toBe('none');
      } finally { await browser.close(); }
    });
  });
}
