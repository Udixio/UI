// React reports a hydration mismatch in development only, so this spec needs the development server:
// MOTION_DOC_URL=http://127.0.0.1:<port> node --test --test-concurrency=1 tests/sequences-hydration.browser.test.mjs
// Against a built site it passes whatever the markup, since the production build has no such report.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium, firefox, webkit } from 'playwright';

const base = process.env.MOTION_DOC_URL ?? 'http://localhost:4322';
const browserTypes = { chromium, firefox, webkit };
const browsers = (process.env.MOTION_BROWSERS ?? 'chromium').split(',').map(name => name.trim());

/** Two frames: the code after them has seen the page painted once. */
const frames = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));

/** The text of React's hydration report, in any of its wordings. */
const HYDRATION_REPORT = /hydrat|did not match/i;

/** The play triangle of the launch scene, and the two bars it morphs into (`LaunchControls.tsx`). */
const PLAY_PATH = 'M8 5 L19 12 L8 19 Z';

for (const name of browsers) {
  if (!Object.hasOwn(browserTypes, name)) throw new Error(`Unknown MOTION_BROWSERS entry: ${name}`);
  const browserType = browserTypes[name];

  test(`${name}: the launch controls hydrate without a mismatch, and the scene plays, pauses and seeks from them`, async () => {
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
      await page.goto(base + '/motion/sequences/', { waitUntil: 'load' });
      await page.locator('[data-motion-scene="launch"]').first().scrollIntoViewIfNeeded();
      // The ruler shows the scene's state once the island has subscribed to it: until then it reads "0 of 0 milliseconds".
      await page.waitForFunction(() => {
        const ruler = document.querySelector('[data-launch-ruler]');
        return ruler !== null && ruler.getAttribute('aria-valuetext') !== '0 of 0 milliseconds';
      });
      await page.waitForLoadState('networkidle');
      await frames(page);
      assert.deepEqual(reports, [], 'React reported a hydration mismatch on the launch controls');

      const toggle = page.locator('[data-launch-toggle]');
      const icon = page.locator('[data-launch-icon]');
      const ruler = page.locator('[data-launch-ruler]');
      const valuetext = () => ruler.getAttribute('aria-valuetext');

      // The ruler seeks the sequence and pauses it: the end, then the start.
      await ruler.focus();
      await page.keyboard.press('End');
      await page.waitForFunction(() => {
        const text = document.querySelector('[data-launch-ruler]').getAttribute('aria-valuetext');
        const [ms, , total] = text.split(' ');
        return ms === total && total !== '0';
      });
      await page.keyboard.press('Home');
      await page.waitForFunction(() => document.querySelector('[data-launch-ruler]').getAttribute('aria-valuetext').startsWith('0 of '));
      await page.waitForFunction(() => document.querySelector('[data-launch-icon]').getAttribute('d') === 'M8 5 L19 12 L8 19 Z');
      assert.equal(await toggle.getAttribute('aria-label'), 'Play the sequence');

      // The button plays the sequence: its icon morphs into the two bars, and the button offers the pause.
      await toggle.click();
      await page.waitForFunction(() => document.querySelector('[data-launch-toggle]').getAttribute('aria-label') === 'Pause the sequence');
      await page.waitForFunction(() => document.querySelector('[data-launch-icon]').getAttribute('d').includes('H10'));

      // The ruler pauses a playing sequence: the icon morphs back into the triangle, and the time stays where it is.
      await ruler.focus();
      await page.keyboard.press('ArrowRight');
      await page.waitForFunction(() => document.querySelector('[data-launch-toggle]').getAttribute('aria-label') === 'Play the sequence');
      await page.waitForFunction(() => document.querySelector('[data-launch-icon]').getAttribute('d') === 'M8 5 L19 12 L8 19 Z');
      const held = await valuetext();
      await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 400)));
      assert.equal(await valuetext(), held, 'the paused sequence kept moving');
      assert.deepEqual(reports, [], 'the controls reported a mismatch while they were used');
    } finally { await browser.close(); }
  });
}
