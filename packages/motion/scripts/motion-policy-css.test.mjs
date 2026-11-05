import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

// Removing the attribute selector from motion.css must make the reduce/no-preference case fail.
test('CSS scale follows the system preference or the document reduce policy', async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.addStyleTag({ path: new URL('../public/motion.css', import.meta.url).pathname });
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
