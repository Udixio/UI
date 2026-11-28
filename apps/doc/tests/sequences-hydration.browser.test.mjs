// React reports a hydration mismatch in development only, so this spec needs the development server:
// MOTION_DOC_URL=http://127.0.0.1:<port> node --test --test-concurrency=1 tests/sequences-hydration.browser.test.mjs
// Against a built site it passes whatever the markup, since the production build has no such report.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium, firefox, webkit } from 'playwright';
import { motionUrl } from './motion-url.mjs';

const base = process.env.MOTION_DOC_URL ?? 'http://localhost:4322';
const browserTypes = { chromium, firefox, webkit };
const browsers = (process.env.MOTION_BROWSERS ?? 'chromium').split(',').map(name => name.trim());

/** Two frames: the code after them has seen the page painted once. */
const frames = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));

/** The text of React's hydration report, in any of its wordings. */
const HYDRATION_REPORT = /hydrat|did not match/i;

/** The React preview of the timeline: the second block of the sequences page (its intro is the first). */
const TIMELINE = '[data-example-panel][data-framework="react"][data-view="preview"]';

for (const name of browsers) {
  if (!Object.hasOwn(browserTypes, name)) throw new Error(`Unknown MOTION_BROWSERS entry: ${name}`);
  const browserType = browserTypes[name];

  test(`${name}: the timeline hydrates without a mismatch, and its controls play, pause and seek the sequence`, async () => {
    const browser = await browserType.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      const reports = [];
      page.on('pageerror', error => reports.push(error.message));
      page.on('console', message => {
        if ((message.type() === 'error' || message.type() === 'warning') && HYDRATION_REPORT.test(message.text())) {
          reports.push(message.text());
        }
      });
      await page.goto(base + motionUrl('sequences'), { waitUntil: 'load' });
      const timeline = page.locator(TIMELINE).nth(1);
      await timeline.scrollIntoViewIfNeeded();
      // The island hydrates when it is in view; its controls react once it has.
      await page.waitForFunction(selector => {
        const panel = document.querySelectorAll(selector)[1];
        const islands = panel ? [...panel.querySelectorAll('astro-island')] : [];
        return islands.length > 0 && islands.every(island => !island.hasAttribute('ssr'));
      }, TIMELINE, { timeout: 60000 });
      await page.waitForLoadState('networkidle');
      await frames(page);
      assert.deepEqual(reports, [], 'React reported a hydration mismatch on the timeline');

      const readout = () => timeline.locator('output').textContent();
      const milliseconds = text => Number.parseFloat(text);
      // Play moves the readout on; Pause holds it where it is.
      await timeline.getByRole('button', { name: 'Play' }).click();
      await page.waitForFunction(selector => parseFloat(document.querySelectorAll(selector)[1].querySelector('output').textContent) > 0, TIMELINE);
      await timeline.getByRole('button', { name: 'Pause' }).click();
      const held = await readout();
      await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 400)));
      assert.equal(await readout(), held, 'the paused sequence kept moving');
      // The slider seeks: End puts the sequence at its end, and the readout follows.
      await timeline.getByRole('slider', { name: 'Sequence time' }).focus();
      await page.keyboard.press('End');
      await page.waitForFunction(([selector, held]) => document.querySelectorAll(selector)[1].querySelector('output').textContent !== held, [TIMELINE, held]);
      assert.ok(milliseconds(await readout()) > milliseconds(held), 'End did not move the readout forward');
      assert.deepEqual(reports, [], 'the controls reported a mismatch while they were used');
    } finally { await browser.close(); }
  });
}
