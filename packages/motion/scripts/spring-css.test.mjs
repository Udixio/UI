import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium, firefox, webkit } from 'playwright';

const root = new URL('../', import.meta.url);
const css = await readFile(new URL('public/motion-springs.generated.css', root), 'utf8');
const source = await readFile(new URL('src/spring-data.generated.ts', root), 'utf8');
const data = JSON.parse(source.slice(source.indexOf(' = ') + 3, source.lastIndexOf(' as const;')));
const types = { chromium, firefox, webkit };
assert.match(css, /@supports \(animation-timing-function: linear\(0, 1\)\)/);

for (const name of (process.env.MOTION_BROWSERS ?? 'chromium,firefox,webkit').split(',').map(s => s.trim())) {
  for (const supports of [true, false]) test(`spring CSS ${supports ? 'native support' : 'simulated fallback'} selects valid complete pairs in ${name}`, async () => {
    const browser = await types[name].launch();
    try {
      const page = await browser.newPage();
        // Force the unsupported branch through a false supports condition while leaving
        // custom properties and the browser cascade intact.
        const stylesheet = supports ? css : css.replace('animation-timing-function: linear(0, 1)', 'animation-timing-function: udixio-unsupported');
        await page.setContent('<!doctype html><html><head></head><body><div id="child"></div></body></html>');
        await page.addStyleTag({ content: stylesheet });
        const native = await page.evaluate(() => CSS.supports('animation-timing-function', 'linear(0, 1)'));
        for (const scheme of [null, 'expressive', 'standard', 'unknown']) {
          const actual = await page.evaluate((scheme) => {
            if (scheme === null) document.documentElement.removeAttribute('data-motion-scheme');
            else document.documentElement.dataset.motionScheme = scheme;
            const style = getComputedStyle(document.querySelector('#child'));
            return Object.fromEntries(['fast', 'default', 'slow'].flatMap(speed => ['spatial', 'effects'].map(kind => {
              const prefix = `--udx-motion-spring-${speed}-${kind}`;
              return [`${speed}-${kind}`, [style.getPropertyValue(`${prefix}-duration`).trim(), style.getPropertyValue(`${prefix}-easing`).trim()]];
            })));
          }, scheme);
          for (const [index, speed] of ['fast', 'default', 'slow'].entries()) for (const kind of ['spatial', 'effects']) {
            const token = data[kind === 'effects' ? 'effects' : scheme === 'standard' ? 'standard' : 'expressive'][index][supports && native ? 'linear' : 'fallback'];
            assert.deepEqual(actual[`${speed}-${kind}`], [`${token.duration}ms`, token.easing], `${scheme} ${speed} ${kind} supports=${supports}`);
            const computed = await page.evaluate(({ speed, kind, token }) => {
              const target = document.querySelector('#child');
              const expected = document.createElement('div');
              document.body.append(expected);
              const prefix = `--udx-motion-spring-${speed}-${kind}`;
              target.style.transitionDuration = `var(${prefix}-duration)`;
              target.style.transitionTimingFunction = `var(${prefix}-easing)`;
              expected.style.transitionDuration = `${token.duration}ms`;
              expected.style.transitionTimingFunction = token.easing;
              const supported = CSS.supports('transition-timing-function', token.easing);
              const values = [getComputedStyle(target).transitionDuration, getComputedStyle(target).transitionTimingFunction];
              const reference = [getComputedStyle(expected).transitionDuration, getComputedStyle(expected).transitionTimingFunction];
              expected.remove();
              return { supported, values, reference };
            }, { speed, kind, token });
            assert.ok(computed.supported, `browser rejected ${scheme} ${speed} ${kind} easing`);
            assert.deepEqual(computed.values, computed.reference, `computed transition ${scheme} ${speed} ${kind} supports=${supports}`);
          }
        }
    } finally { await browser.close(); }
  });
}
