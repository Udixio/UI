import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { chromium, firefox, webkit } from 'playwright';

const browserTypes = { chromium, firefox, webkit };
const browsers = (process.env.MOTION_BROWSERS ?? 'chromium,firefox,webkit')
  .split(',')
  .map((name) => name.trim());

// Removing the attribute selector from motion.css must make the reduce/no-preference case fail.
for (const name of browsers) test(`CSS scale follows the system preference or document policy (${name})`, async () => {
  assert.ok(Object.hasOwn(browserTypes, name), `Unsupported browser: ${name}`);
  const browser = await browserTypes[name].launch();
  try {
    const page = await browser.newPage();
    // Serve the stylesheet from a page origin: its relative @import rules fail in a
    // <style> injected into about:blank, which WebKit reports as a load error.
    await page.route('http://motion.test/**', (route) => {
      const { pathname } = new URL(route.request().url());
      if (pathname === '/') return route.fulfill({ contentType: 'text/html', body: '<link rel="stylesheet" href="/motion.css">' });
      return route.fulfill({ path: fileURLToPath(new URL(`../public${pathname}`, import.meta.url)) });
    });
    await page.goto('http://motion.test/');
    for (const preference of ['no-preference', 'reduce']) {
      await page.emulateMedia({ reducedMotion: preference });
      for (const policy of [null, 'auto', 'reduce', 'unknown']) {
        const scale = await page.evaluate((value) => {
          if (value === null) document.documentElement.removeAttribute('data-motion-policy');
          else document.documentElement.setAttribute('data-motion-policy', value);
          return getComputedStyle(document.documentElement).getPropertyValue('--udx-motion-scale').trim();
        }, policy);
        assert.equal(scale, preference === 'reduce' || policy === 'reduce' ? '0' : '1', `${preference}, ${policy}`);
      }
    }
  } finally {
    await browser.close();
  }
});
