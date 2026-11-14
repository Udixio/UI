import { chromium, firefox, webkit } from 'playwright';
import { build } from 'vite';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { motionBrowsers } from './test-support/motion-browsers.mjs';

async function bundle() {
  const result = await build({ configFile: false, logLevel: 'error', define: { 'process.env.NODE_ENV': JSON.stringify('production') }, resolve: { conditions: ['development'] }, build: { write: false, minify: false, lib: { entry: resolve(__dirname, './test-support/progress-controller-entry.ts'), name: 'ProgressControllers', formats: ['iife'] } } });
  const chunk = (Array.isArray(result) ? result[0] : result).output.find(item => item.type === 'chunk');
  if (!chunk || chunk.type !== 'chunk') throw new Error('progress bundle missing');
  return chunk.code;
}

for (const name of motionBrowsers(process.env.MOTION_BROWSERS)) {
  const engine = { chromium, firefox, webkit }[name as 'chromium' | 'firefox' | 'webkit'];
  describe(`Progress motion in ${name}`, () => {
    it('starts reduced, resumes, stops during motion and preserves external changes on destroy', async () => {
      const script = await bundle();
      const browser = await engine.launch();
      try {
        const page = await browser.newPage({ reducedMotion: 'reduce' });
        await page.setContent('<div role="progressbar" aria-label="Loading"><div id="leading" style="width: 31%"></div><div id="gap"></div><div id="trailing"></div></div><svg role="progressbar" aria-label="Loading circle" id="svg"><circle id="circle" pathLength="2" /></svg>');
        await page.addScriptTag({ content: script });
        await page.evaluate(() => {
          const api = (window as any).ProgressControllers;
          (window as any).cleanups = [api.createLinearIndeterminateController({ leadingBar: document.querySelector('#leading'), gapTrack: document.querySelector('#gap'), trailingBar: document.querySelector('#trailing') }), api.createCircularProgressController({ svg: document.querySelector('#svg'), circle: document.querySelector('#circle') })];
        });
        const leading = page.locator('#leading');
        const circle = page.locator('#circle');
        const svg = page.locator('#svg');
        expect(await leading.evaluate(el => (el as HTMLElement).style.width)).toBe('20%');
        expect(await circle.evaluate(el => (el as SVGElement).style.strokeDasharray)).toMatch(/^0\.25(?:px)?[, ]+1(?:px)?$/);
        expect(await page.getByRole('progressbar').count()).toBe(2);
        expect(await page.getByRole('progressbar').first().getAttribute('aria-valuenow')).toBeNull();
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        await expect.poll(() => svg.evaluate(el => (el as SVGElement).style.transform)).not.toBe('rotate(-90deg)');
        await expect.poll(() => leading.evaluate(el => (el as HTMLElement).style.width)).not.toBe('20%');
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await expect.poll(() => svg.evaluate(el => (el as SVGElement).style.transform)).toBe('rotate(-90deg)');
        await page.waitForTimeout(120);
        expect(await svg.evaluate(el => (el as SVGElement).style.transform)).toBe('rotate(-90deg)');
        expect(await leading.evaluate(el => (el as HTMLElement).style.width)).toBe('20%');
        expect(await circle.evaluate(el => (el as SVGElement).style.strokeDasharray)).toMatch(/^0\.25(?:px)?[, ]+1(?:px)?$/);
        await page.evaluate(() => {
          (document.querySelector('#leading') as HTMLElement).style.width = '42%';
          document.querySelector('#circle')!.setAttribute('pathLength', '3');
          for (const cleanup of (window as any).cleanups) { cleanup(); cleanup(); }
        });
        expect(await leading.evaluate(el => (el as HTMLElement).style.width)).toBe('42%');
        expect(await circle.getAttribute('pathLength')).toBe('3');
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        await page.waitForTimeout(100);
        const stoppedTransform = await svg.evaluate(el => (el as SVGElement).style.transform);
        await page.waitForTimeout(100);
        expect(await svg.evaluate(el => (el as SVGElement).style.transform)).toBe(stoppedTransform);
      } finally { await browser.close(); }
    });

    it('preserves external styles written during animation when destroyed', async () => {
      const script = await bundle();
      const browser = await engine.launch();
      try {
        const page = await browser.newPage({ reducedMotion: 'no-preference' });
        await page.setContent('<div id="leading"></div><div id="gap"></div><div id="trailing"></div><svg id="svg"><circle id="circle" /></svg>');
        await page.addScriptTag({ content: script });
        await page.evaluate(() => {
          const api = (window as any).ProgressControllers;
          (window as any).cleanups = [api.createLinearIndeterminateController({ leadingBar: document.querySelector('#leading'), gapTrack: document.querySelector('#gap'), trailingBar: document.querySelector('#trailing') }), api.createCircularProgressController({ svg: document.querySelector('#svg'), circle: document.querySelector('#circle') })];
        });
        await expect.poll(() => page.locator('#svg').evaluate(el => (el as SVGElement).style.transform)).not.toBe('rotate(-90deg)');
        await page.evaluate(() => {
          (document.querySelector('#leading') as HTMLElement).style.width = '42%';
          (document.querySelector('#svg') as SVGElement).style.transform = 'rotate(42deg)';
          for (const cleanup of (window as any).cleanups) cleanup();
        });
        await page.waitForTimeout(100);
        expect(await page.locator('#leading').evaluate(el => (el as HTMLElement).style.width)).toBe('42%');
        expect(await page.locator('#svg').evaluate(el => (el as SVGElement).style.transform)).toBe('rotate(42deg)');
      } finally { await browser.close(); }
    });

    it('restores original styles when destroyed during active animation', async () => {
      const script = await bundle();
      const browser = await engine.launch();
      try {
        const page = await browser.newPage({ reducedMotion: 'no-preference' });
        await page.setContent('<div id="leading" style="width:31% !important"></div><div id="gap" style="width:11%"></div><div id="trailing"></div><svg id="svg" style="transform:rotate(12deg)"><circle id="circle" pathLength="2" /></svg>');
        await page.addScriptTag({ content: script });
        await page.evaluate(() => {
          const api = (window as any).ProgressControllers;
          (window as any).cleanups = [api.createLinearIndeterminateController({ leadingBar: document.querySelector('#leading'), gapTrack: document.querySelector('#gap'), trailingBar: document.querySelector('#trailing') }), api.createCircularProgressController({ svg: document.querySelector('#svg'), circle: document.querySelector('#circle') })];
        });
        await expect.poll(() => page.locator('#svg').evaluate(el => (el as SVGElement).style.transform)).not.toBe('rotate(-90deg)');
        expect(await page.locator('#circle').evaluate(el => getComputedStyle(el).transformBox)).toBe('fill-box');
        expect(await page.locator('#circle').evaluate(el => (el as SVGElement).style.transformOrigin)).toMatch(/^50% 50%(?: 0px)?$/);
        await page.evaluate(() => { for (const cleanup of (window as any).cleanups) cleanup(); });
        await page.waitForTimeout(100);
        expect(await page.locator('#leading').evaluate(el => (el as HTMLElement).style.width)).toBe('31%');
        expect(await page.locator('#leading').evaluate(el => (el as HTMLElement).style.getPropertyPriority('width'))).toBe('important');
        expect(await page.locator('#gap').evaluate(el => (el as HTMLElement).style.width)).toBe('11%');
        expect(await page.locator('#svg').evaluate(el => (el as SVGElement).style.transform)).toBe('rotate(12deg)');
        expect(await page.locator('#circle').getAttribute('pathLength')).toBe('2');
      } finally { await browser.close(); }
    });

    it('restores an external write after animation resumes and policy reduces', async () => {
      const script = await bundle();
      const browser = await engine.launch();
      try {
        const page = await browser.newPage({ reducedMotion: 'no-preference' });
        await page.setContent('<div id="leading" style="width:31%"></div><div id="gap"></div><div id="trailing"></div>');
        await page.addScriptTag({ content: script });
        await page.evaluate(() => {
          const api = (window as any).ProgressControllers;
          (window as any).cleanup = api.createLinearIndeterminateController({ leadingBar: document.querySelector('#leading'), gapTrack: document.querySelector('#gap'), trailingBar: document.querySelector('#trailing') });
        });
        const leading = page.locator('#leading');
        await expect.poll(() => leading.evaluate(el => (el as HTMLElement).style.width)).not.toBe('20%');
        await leading.evaluate(el => { (el as HTMLElement).style.width = '42%'; });
        await expect.poll(() => leading.evaluate(el => (el as HTMLElement).style.width)).not.toBe('42%');
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await expect.poll(() => leading.evaluate(el => (el as HTMLElement).style.width)).toBe('20%');
        await page.evaluate(() => (window as any).cleanup());
        await page.waitForTimeout(100);
        expect(await leading.evaluate(el => (el as HTMLElement).style.width)).toBe('42%');
      } finally { await browser.close(); }
    });

    it('matches Motion SVG geometry during an active loop', async () => {
      const script = await bundle();
      const browser = await engine.launch();
      try {
        const page = await browser.newPage({ reducedMotion: 'no-preference' });
        await page.setContent('<svg id="svg" viewBox="0 0 48 48" width="48" height="48"><circle id="circle" cx="24" cy="24" r="18" /></svg><svg id="ref-svg" viewBox="0 0 48 48" width="48" height="48"><circle id="ref-circle" cx="24" cy="24" r="18" /></svg>');
        await page.addScriptTag({ content: script });
        await page.evaluate(() => {
          const api = (window as any).ProgressControllers;
          const svg = document.querySelector('#svg');
          const circle = document.querySelector('#circle');
          const refSvg = document.querySelector('#ref-svg');
          const refCircle = document.querySelector('#ref-circle');
          (window as any).cleanup = api.createCircularProgressController({ svg, circle });
          (window as any).reference = [api.animate(refSvg, { rotate: [-90, 270] }, { duration: 1.5, repeat: Infinity, ease: 'linear' }), api.animate(refCircle, { pathLength: [0.1, 0.9, 0.1], rotate: [0, 0, 360] }, { duration: 3, repeat: Infinity, ease: 'easeInOut' })];
        });
        await page.waitForTimeout(450);
        const geometry = await page.evaluate(() => {
          const values = (selector: string) => {
            const el = document.querySelector(selector)!;
            const style = getComputedStyle(el);
            const matrix = new DOMMatrix(style.transform);
            return { a: matrix.a, b: matrix.b, dash: parseFloat(style.strokeDasharray), box: style.transformBox, origin: style.transformOrigin, rect: el.getBoundingClientRect().toJSON() };
          };
          return { svg: values('#svg'), refSvg: values('#ref-svg'), circle: values('#circle'), refCircle: values('#ref-circle') };
        });
        expect(geometry.svg.a).toBeCloseTo(geometry.refSvg.a, 1);
        expect(geometry.svg.b).toBeCloseTo(geometry.refSvg.b, 1);
        expect(geometry.circle.dash).toBeCloseTo(geometry.refCircle.dash, 1);
        expect(geometry.circle.box).toBe(geometry.refCircle.box);
        expect(geometry.circle.origin).toBe(geometry.refCircle.origin);
        expect(geometry.circle.rect.width).toBeCloseTo(geometry.refCircle.rect.width, 0);
        await page.evaluate(() => { (window as any).cleanup(); for (const animation of (window as any).reference) animation.cancel(); });
      } finally { await browser.close(); }
    });

    it('restores original styles after document reduction and destroy', async () => {
      const script = await bundle();
      const browser = await engine.launch();
      try {
        const page = await browser.newPage({ reducedMotion: 'no-preference' });
        await page.setContent('<div id="leading" style="width:31%"></div><div id="gap" style="width:11%"></div><div id="trailing"></div><svg id="svg" style="transform:rotate(12deg)"><circle id="circle" pathLength="2" /></svg>');
        await page.addScriptTag({ content: script });
        await page.evaluate(() => {
          document.documentElement.setAttribute('data-motion-policy', 'reduce');
          const api = (window as any).ProgressControllers;
          (window as any).cleanups = [api.createLinearIndeterminateController({ leadingBar: document.querySelector('#leading'), gapTrack: document.querySelector('#gap'), trailingBar: document.querySelector('#trailing') }), api.createCircularProgressController({ svg: document.querySelector('#svg'), circle: document.querySelector('#circle') })];
        });
        expect(await page.locator('#leading').evaluate(el => (el as HTMLElement).style.width)).toBe('20%');
        await page.evaluate(() => { for (const cleanup of (window as any).cleanups) cleanup(); });
        expect(await page.locator('#leading').evaluate(el => (el as HTMLElement).style.width)).toBe('31%');
        expect(await page.locator('#gap').evaluate(el => (el as HTMLElement).style.width)).toBe('11%');
        expect(await page.locator('#svg').evaluate(el => (el as SVGElement).style.transform)).toBe('rotate(12deg)');
        expect(await page.locator('#circle').getAttribute('pathLength')).toBe('2');
      } finally { await browser.close(); }
    });

    it('keeps completion visible until its delay and cancels a pending hide', async () => {
      const script = await bundle();
      const browser = await engine.launch();
      try {
        const page = await browser.newPage();
        await page.setContent('<div id="progress" role="progressbar" aria-valuenow="100" style="width:100px;height:4px"></div>');
        const now = new Date('2026-01-01T00:00:00Z');
        await page.clock.install({ time: now });
        await page.clock.pauseAt(now);
        await page.addScriptTag({ content: script });
        await page.evaluate(() => {
          const api = (window as any).ProgressControllers;
          const el = document.querySelector('#progress') as HTMLElement;
          const onVisibilityChange = (visible: boolean) => { el.hidden = !visible; };
          (window as any).cancelHide = api.createProgressVisibilityController({ completedPercentage: 100, transitionDuration: 100, onVisibilityChange });
        });
        expect(await page.locator('#progress').isVisible()).toBe(true);
        await page.clock.fastForward(99);
        expect(await page.locator('#progress').isVisible()).toBe(true);
        await page.clock.fastForward(1);
        expect(await page.locator('#progress').isHidden()).toBe(true);
        await page.evaluate(() => {
          const api = (window as any).ProgressControllers;
          const el = document.querySelector('#progress') as HTMLElement;
          const onVisibilityChange = (visible: boolean) => { el.hidden = !visible; };
          api.createProgressVisibilityController({ completedPercentage: 99, transitionDuration: 100, onVisibilityChange });
          const cancel = api.createProgressVisibilityController({ completedPercentage: 100, transitionDuration: 100, onVisibilityChange });
          cancel();
        });
        await page.clock.fastForward(150);
        expect(await page.locator('#progress').isVisible()).toBe(true);
      } finally { await browser.close(); }
    });
  });
}
