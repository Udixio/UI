import { motionBrowsers } from './test-support/motion-browsers.mjs';
import { compile } from '@tailwindcss/node';
import { chromium, firefox, webkit } from 'playwright';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
// Exercise the current core source without adding a package dependency to Tailwind.
// eslint-disable-next-line @nx/enforce-module-boundaries
import { searchStyle } from '../../core/src/lib/styles/search.style';

const styles = searchStyle({
  label: 'Search',
  isFocused: false,
  isExpanded: false,
  hasQuery: true,
  hasResults: false,
  clearable: true,
} as Parameters<typeof searchStyle>[0]);
const custom = searchStyle({
  label: 'Search',
  isFocused: false,
  isExpanded: false,
  hasQuery: true,
  hasResults: false,
  clearable: true,
  className: { container: 'transition-none' },
} as Parameters<typeof searchStyle>[0]);
const classes = [...Object.values(styles), ...Object.values(custom)].flatMap(
  (value) => value.split(/\s+/),
);

for (const name of motionBrowsers(process.env.MOTION_BROWSERS)) {
  const engine = { chromium, firefox, webkit }[name as 'chromium' | 'firefox' | 'webkit'];
  describe(`Search motion in ${name}`, () => {
    it('applies fallback, overrides and live reduction to both outlines', async () => {
      const { build } = await compile(
        '@import "tailwindcss"; @theme { --color-secondary: #6750a4; }',
        {
          base: resolve(__dirname, '..'),
          onDependency: () => { /* No dependency tracking is needed for this test. */ },
        },
      );
      const css = build(classes);
      const browser = await engine.launch();
      const page = await browser.newPage({ reducedMotion: 'no-preference' });
      try {
        await page.setContent(
          `<style>${css}</style><div id="ancestor"><div id="container" class="${styles.container}"><input id="input"><button id="clear" class="${styles.clearButton}">Clear</button></div></div>`,
        );
        const sample = () =>
          page.locator('#container, #clear').evaluateAll((els) =>
            els.map((el) => ({
              property: getComputedStyle(el).transitionProperty,
              duration: getComputedStyle(el).transitionDuration,
              easing: getComputedStyle(el).transitionTimingFunction,
            })),
          );
        for (const value of await sample()) {
          expect(value).toEqual({
            property: 'outline-color',
            duration: '0.2s',
            easing: 'cubic-bezier(0, 0, 0.2, 1)',
          });
        }
        await page.evaluate((className) => {
          const custom = document.createElement('div');
          custom.id = 'custom';
          custom.className = className;
          document.body.append(custom);
        }, custom.container);
        expect(
          await page
            .locator('#custom')
            .evaluate((el) => getComputedStyle(el).transitionProperty),
        ).toBe('none');
        await page.locator('#ancestor').evaluate((el) => {
          (el as HTMLElement).style.setProperty(
            '--udx-motion-duration-short4',
            '600ms',
          );
          (el as HTMLElement).style.setProperty('--udx-motion-scale', '0.5');
        });
        expect((await sample()).map((x) => x.duration)).toEqual([
          '0.3s',
          '0.3s',
        ]);
        await page
          .locator('#clear')
          .evaluate((el) =>
            (el as HTMLElement).style.setProperty('--udx-motion-scale', '0.25'),
          );
        expect((await sample()).map((x) => x.duration)).toEqual([
          '0.3s',
          '0.15s',
        ]);
        await page.emulateMedia({ reducedMotion: 'reduce' });
        expect((await sample()).map((x) => x.property)).toEqual([
          'none',
          'none',
        ]);
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        await page.evaluate(() =>
          document.documentElement.setAttribute('data-motion-policy', 'reduce'),
        );
        expect((await sample()).map((x) => x.property)).toEqual([
          'none',
          'none',
        ]);
        await page.evaluate(() =>
          document.documentElement.setAttribute('data-motion-policy', 'auto'),
        );
        expect((await sample()).map((x) => x.property)).toEqual([
          'outline-color',
          'outline-color',
        ]);
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');
        expect(
          await page
            .locator('#clear')
            .evaluate((el) => el.matches(':focus-visible')),
        ).toBe(true);
        await page.waitForTimeout(250);
        expect(
          await page
            .locator('#clear')
            .evaluate((el) => getComputedStyle(el).outlineColor),
        ).toBe('rgb(103, 80, 164)');
        await page.evaluate(() =>
          document.documentElement.setAttribute(
            'data-motion-policy',
            'unknown',
          ),
        );
        expect((await sample()).map((x) => x.property)).toEqual([
          'outline-color',
          'outline-color',
        ]);
        await page.emulateMedia({ reducedMotion: 'reduce' });
        expect((await sample()).map((x) => x.property)).toEqual([
          'none',
          'none',
        ]);
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        await page.evaluate(
          ({ css, classes, clearClasses }) => {
            const host = document.createElement('div');
            host.id = 'plain-host';
            const shadow = host.attachShadow({ mode: 'open' });
            shadow.innerHTML = `<style>${css}</style><div class="${classes}"></div><button class="${clearClasses}">Clear</button>`;
            document.body.append(host);
            document.documentElement.setAttribute(
              'data-motion-policy',
              'reduce',
            );
          },
          { css, classes: styles.container, clearClasses: styles.clearButton },
        );
        const plain = () =>
          page
            .locator('#plain-host')
            .evaluate((host) =>
              Array.from(host.shadowRoot!.querySelectorAll('div, button')).map(
                (el) => getComputedStyle(el).transitionProperty,
              ),
            );
        expect(await plain()).toEqual(['outline-color', 'outline-color']);
        await page.emulateMedia({ reducedMotion: 'reduce' });
        expect(await plain()).toEqual(['none', 'none']);
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        await page.evaluate(() => {
          document.documentElement.removeAttribute('data-motion-policy');
          document.querySelector('#plain-host')!.remove();
        });
        await page
          .locator('#ancestor')
          .evaluate((el) => (el as HTMLElement).removeAttribute('style'));
        await page
          .locator('#clear')
          .evaluate((el) => (el as HTMLElement).removeAttribute('style'));
        await page.evaluate(() => {
          const container = document.querySelector<HTMLElement>('#container')!;
          const input = document.querySelector<HTMLInputElement>('#input')!;
          container.style.outlineColor = 'transparent';
          (window as any).searchTransitions = [];
          container.addEventListener('transitionrun', (event) =>
            (window as any).searchTransitions.push(event.propertyName),
          );
          input.addEventListener('focus', () => {
            container.style.outlineColor = 'rgb(255, 0, 0)';
          });
          input.addEventListener('blur', () => {
            container.style.outlineColor = 'transparent';
          });
        });
        await page.locator('#input').focus();
        await page.waitForTimeout(50);
        await page.locator('#clear').focus();
        await page.waitForTimeout(300);
        expect(
          await page
            .locator('#container')
            .evaluate((el) => getComputedStyle(el).outlineColor),
        ).toBe('rgba(0, 0, 0, 0)');
        expect(
          await page.evaluate(() => (window as any).searchTransitions),
        ).toEqual(expect.arrayContaining(['outline-color']));
        expect(
          await page.evaluate(() =>
            (window as any).searchTransitions.every(
              (p: string) => p === 'outline-color',
            ),
          ),
        ).toBe(true);
        await page.evaluate(() => {
          const clear = document.querySelector<HTMLButtonElement>('#clear')!;
          clear.blur();
          clear.style.outlineColor = 'transparent';
          (window as any).clearTransitions = [];
          clear.addEventListener('transitionrun', (event) =>
            (window as any).clearTransitions.push(event.propertyName),
          );
          clear.addEventListener('focus', () => {
            clear.style.outlineColor = 'rgb(255, 0, 0)';
          });
          clear.addEventListener('blur', () => {
            clear.style.outlineColor = 'transparent';
          });
        });
        await page.locator('#clear').focus();
        await page.waitForTimeout(50);
        await page.locator('#input').focus();
        await page.waitForTimeout(300);
        expect(
          await page
            .locator('#clear')
            .evaluate((el) => getComputedStyle(el).outlineColor),
        ).toBe('rgba(0, 0, 0, 0)');
        expect(
          await page.evaluate(() => (window as any).clearTransitions),
        ).toEqual(expect.arrayContaining(['outline-color']));
        expect(
          await page.evaluate(() =>
            (window as any).clearTransitions.every(
              (p: string) => p === 'outline-color',
            ),
          ),
        ).toBe(true);
        await page.evaluate(() => {
          const input = document.querySelector<HTMLInputElement>('#input')!;
          const clear = document.querySelector<HTMLButtonElement>('#clear')!;
          input.disabled = true;
          clear.disabled = true;
          input.blur();
        });
        await page.keyboard.press('Tab');
        expect(
          await page
            .locator('#input')
            .evaluate((el) => el === document.activeElement),
        ).toBe(false);
        expect(
          await page
            .locator('#clear')
            .evaluate((el) => el === document.activeElement),
        ).toBe(false);
        await page.evaluate(() => {
          document.querySelector<HTMLInputElement>('#input')!.disabled = false;
          document.querySelector<HTMLButtonElement>('#clear')!.disabled = false;
        });
        const motion = readFileSync(
          resolve(__dirname, '../../motion/public/motion.css'),
          'utf8',
        ).replace(/^@import.*;$/gm, '');
        const curves = readFileSync(
          resolve(__dirname, '../../motion/public/motion-curves.generated.css'),
          'utf8',
        );
        await page.addStyleTag({ content: `${curves}\n${motion}` });
        await page
          .locator('#ancestor')
          .evaluate((el) => (el as HTMLElement).removeAttribute('style'));
        await page
          .locator('#clear')
          .evaluate((el) => (el as HTMLElement).removeAttribute('style'));
        for (const value of await sample())
          expect(value.easing).toBe('cubic-bezier(0, 0, 0, 1)');
        await page.evaluate(
          ({ css, classes, clearClasses }) => {
            const host = document.createElement('div');
            host.id = 'host';
            const shadow = host.attachShadow({ mode: 'open' });
            shadow.innerHTML = `<style>${css}</style><div class="${classes}"></div><button class="${clearClasses}">Clear</button>`;
            document.body.append(host);
            document.documentElement.setAttribute(
              'data-motion-policy',
              'reduce',
            );
          },
          { css, classes: styles.container, clearClasses: styles.clearButton },
        );
        const shadowDuration = () =>
          page
            .locator('#host')
            .evaluate((host) =>
              Array.from(host.shadowRoot!.querySelectorAll('div, button')).map(
                (el) => getComputedStyle(el).transitionDuration,
              ),
            );
        expect(await shadowDuration()).toEqual(['0s', '0s']);
        await page
          .locator('#host')
          .evaluate((host) =>
            (host as HTMLElement).style.setProperty(
              '--udx-motion-scale',
              '0.5',
            ),
          );
        expect(await shadowDuration()).toEqual(['0.1s', '0.1s']);
        await page.locator('#host').evaluate((host) => {
          const elements =
            host.shadowRoot!.querySelectorAll<HTMLElement>('div, button');
          elements[0].style.setProperty('--udx-motion-scale', '0.25');
          elements[1].style.setProperty('--udx-motion-scale', '0.75');
        });
        expect(await shadowDuration()).toEqual(['0.05s', '0.15s']);
      } finally {
        await browser.close();
      }
    });
  });
}
