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

/** Clicks until the press plays (an island binds once it has bootstrapped), and returns what runs on the element and its parent. */
async function pressed(page, locator) {
  let result;
  for (let attempt = 0; attempt < 20; attempt++) {
    await locator.click();
    // A change of state plays after the render that applies it (Angular's afterRenderEffect): a frame later.
    await page.waitForTimeout(40);
    result = await animations(await locator.elementHandle());
    if (result.own.includes('scale')) break;
    await page.waitForTimeout(300);
  }
  return result;
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
        const save = root.locator('[data-trial-part="press"]').getByRole('button', { name: /^Save/ });
        const press = await pressed(page, save);
        assert.ok(press.own.includes('scale'), `${framework}: the press scales the button (${press.own})`);
        assert.deepEqual(press.parent, [], `${framework}: nothing runs on the button's parent`);
        if (framework !== 'svelte') assert.equal(press.parentDisplay, 'contents', `${framework}: the wrapper has no box`);

        // Appear and exit on Card: the exit plays on the Card's root, then a new entry plays on its root.
        const appear = root.locator('[data-trial-part="appear"]');
        await appear.getByRole('button', { name: 'Hide the card', exact: true }).click();
        await page.waitForTimeout(30);
        const leaving = appear.locator('[data-motion-presence="exiting"]');
        assert.equal(await leaving.count(), 1, `${framework}: the card's root is exiting`);
        assert.equal(await leaving.evaluate(el => el.textContent.includes('Weekly report')), true);
        const exit = await animations(await leaving.elementHandle());
        assert.ok(exit.own.length > 0, `${framework}: the card's root plays its exit (${exit.own})`);
        assert.deepEqual(exit.parent, [], `${framework}: nothing runs on the card's parent`);
        // Removed (React, Angular) or hidden (Svelte, whose Card stays) once its exit has played.
        await page.waitForFunction(
          part => [...document.querySelectorAll(`${part} [data-motion-presence]`)].every(el => el.hidden || el.closest('[hidden]')),
          `[data-trial="${framework}"] [data-trial-part="appear"]`,
          { timeout: 5000 },
        );
        await appear.getByRole('button', { name: 'Show the card', exact: true }).click();
        await page.waitForTimeout(30);
        const card = appear.locator('[data-motion-presence]:not([inert])').first();
        assert.equal(await card.evaluate(el => el.textContent.includes('Weekly report')), true);
        const entry = await animations(await card.elementHandle());
        assert.ok(entry.own.length > 0, `${framework}: the card's root plays its entry (${entry.own})`);
        assert.deepEqual(entry.parent, [], `${framework}: nothing runs on the card's parent`);

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

        // A new root: the Button becomes a link (Angular's @if renders an <a> in place of the <button>), and the press moves
        // the <a> itself, still with nothing on its parent.
        await root.getByRole('button', { name: 'Make it a link', exact: true }).click();
        const link = root.locator('[data-trial-part="press"]').getByRole('link', { name: /^Save/ });
        await link.waitFor({ timeout: 5000 });
        const linkPress = await pressed(page, link);
        assert.ok(linkPress.own.includes('scale'), `${framework}: the press scales the link (${linkPress.own})`);
        assert.deepEqual(linkPress.parent, [], `${framework}: nothing runs on the link's parent`);
        if (framework !== 'svelte') assert.equal(linkPress.parentDisplay, 'contents', `${framework}: the wrapper of the link has no box`);
        assert.equal(await root.locator('[data-trial-part="press"]').getByRole('button', { name: /^Save/ }).count(), 0);
        await root.getByRole('button', { name: 'Make it a button', exact: true }).click();
        const again = await pressed(page, save);
        assert.ok(again.own.includes('scale'), `${framework}: the press scales the button again (${again.own})`);
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
