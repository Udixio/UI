// TRIAL (review 5, Q3): delete with the trial page, or keep it with the page, once the maintainer has decided.
// Run against the site: MOTION_BROWSERS=chromium MOTION_DOC_URL=http://localhost:4322 node --test tests/trial-components-without-wrapper.browser.test.mjs
// TRIAL_SCREENSHOTS=<dir> also writes screenshots of the page at 1280 and 375 px.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { chromium, firefox, webkit } from 'playwright';

const base = process.env.MOTION_DOC_URL ?? 'http://localhost:4322';
const browserTypes = { chromium, firefox, webkit };
const browsers = (process.env.MOTION_BROWSERS ?? 'chromium').split(',').map(name => name.trim());
const shots = process.env.TRIAL_SCREENSHOTS;
const PAGE = '/motion/trial/components-without-wrapper';
const FRAMEWORKS = ['react', 'angular', 'svelte'];

/** Scrolls once so the islands loaded on visibility hydrate, then waits for them. */
async function settle(page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) {
      window.scrollTo(0, y);
      await new Promise(resolve => setTimeout(resolve, 60));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForFunction(() => document.querySelectorAll('astro-island[ssr]').length === 0, null, { timeout: 60000 });
  await page.waitForTimeout(500);
}

/** What runs on an element and on its parent: the animated properties of each, and whether the parent has a box. */
function animations(handle) {
  return handle.evaluate(el => {
    const props = node =>
      node.getAnimations().flatMap(animation => Object.keys(animation.effect.getKeyframes()[0] ?? {}).filter(key => !['offset', 'easing', 'composite', 'computedOffset'].includes(key)));
    return { own: props(el), parent: props(el.parentElement), parentDisplay: getComputedStyle(el.parentElement).display };
  });
}

for (const name of browsers) {
  test(`trial: Udixio components take a motion with no wrapper, in ${name}`, async () => {
    const browser = await browserTypes[name].launch();
    try {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(`${base}${PAGE}`, { waitUntil: 'load' });
      await settle(page);

      for (const framework of FRAMEWORKS) {
        const root = page.locator(`[data-trial="${framework}"]`);

        // Press on Button: the <button> itself scales, its wrapper has no box and nothing runs on it.
        const save = root.locator('[data-trial-part="press"] button').first();
        // An island binds once it has bootstrapped (Angular's after its first render): a click before that plays nothing.
        let press;
        for (let attempt = 0; attempt < 20; attempt++) {
          await save.click();
          // A change of state plays after the render that applies it (Angular's afterRenderEffect): a frame later.
          await page.waitForTimeout(40);
          press = await animations(await save.elementHandle());
          if (press.own.includes('scale')) break;
          await page.waitForTimeout(300);
        }
        assert.ok(press.own.includes('scale'), `${framework}: the press scales the button (${press.own})`);
        assert.deepEqual(press.parent, [], `${framework}: nothing runs on the button's parent`);
        if (framework !== 'svelte') assert.equal(press.parentDisplay, 'contents', `${framework}: the wrapper has no box`);

        // Appear on Card: each new card enters on its own root.
        await root.getByRole('button', { name: 'Show the card again' }).click();
        await page.waitForTimeout(30);
        // The new card: an Angular card that leaves plays its exit beside it, inert.
        const card = root.locator('[data-trial-part="appear"] [data-motion-presence]:not([inert])').first();
        assert.equal(await card.evaluate(el => el.firstElementChild?.textContent?.includes('Weekly report') || el.textContent.includes('Weekly report')), true);
        const entry = await animations(await card.elementHandle());
        assert.ok(entry.own.length > 0, `${framework}: the card's root plays its entry`);
        assert.equal(await card.getAttribute('data-motion-presence') !== null, true, `${framework}: the card's root holds the presence`);

        // Shake on TextField: the field's root moves, its input does not move on its own.
        // By its place, not its name: the Angular and the Svelte fields both count their ids from text-field-0 on one page.
        await root.locator('[data-trial-part="shake"] input').fill('0000');
        await root.getByRole('button', { name: 'Check' }).click();
        await page.waitForTimeout(40);
        const input = root.locator('[data-trial-part="shake"] input');
        const field = input.locator('xpath=ancestor::fieldset/..');
        const shake = await animations(await field.elementHandle());
        assert.ok(shake.own.includes('translate'), `${framework}: the shake moves the field's root (${shake.own})`);
        const own = await input.evaluate(el => el.getAnimations().length);
        assert.equal(own, 0, `${framework}: the input has no motion of its own`);

        // Focus goes to the button itself: the wrapper is no tab stop.
        await save.focus();
        assert.equal(await save.evaluate(el => document.activeElement === el), true);
      }
      assert.deepEqual(errors, []);

      if (shots) {
        await page.waitForTimeout(800);
        await page.screenshot({ path: join(shots, `trial-${name}-1280.png`), fullPage: true });
        await page.setViewportSize({ width: 375, height: 800 });
        await page.waitForTimeout(400);
        await page.screenshot({ path: join(shots, `trial-${name}-375.png`), fullPage: true });
      }
    } finally {
      await browser.close();
    }
  });
}
