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

/**
 * The box of an element: its child marked data-motion-box, else its first element child, when it is declared with no box
 * (data-motion-box="child", what a React wrapper and an Angular host carry), else the element itself.
 */
function boxOf(handle) {
  return handle.evaluateHandle(el =>
    el.getAttribute('data-motion-box') === 'child' ? (el.querySelector(':scope > [data-motion-box]') ?? el.firstElementChild) : el,
  );
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
        // The host carries the state (the wrapper, the Angular host, the Svelte Card's root), its box the pixels.
        const leaving = appear.locator('[data-motion-presence="exiting"]');
        assert.equal(await leaving.count(), 1, `${framework}: the card's host is exiting`);
        assert.equal(await leaving.evaluate(el => el.textContent.includes('Weekly report')), true);
        const exit = await animations(await boxOf(await leaving.elementHandle()));
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
        const entry = await animations(await boxOf(await card.elementHandle()));
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

/**
 * Closed content in the server HTML: before any script runs, and on every frame until the islands have hydrated, the details
 * are not drawn. A box-less host is hidden by [hidden] (React's wrapper has no display: contents while absent, an Angular host
 * takes display: contents from a class that yields to [hidden], a Svelte Card's root is hidden itself).
 */
for (const name of browsers) {
  test(`trial: closed content rendered by the server shows no flash before hydration, then opens and closes on its box, in ${name}`, async () => {
    const browser = await browserTypes[name].launch();
    try {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      // Every frame from the first one, the details that are drawn are recorded.
      await page.addInitScript(() => {
        window.__trialFlashes = [];
        const watch = () => {
          for (const el of document.querySelectorAll('[data-trial-part="closed"] [data-trial-details]')) {
            const framework = el.closest('[data-trial]')?.getAttribute('data-trial');
            if (el.getBoundingClientRect().height > 0 && !window.__trialFlashes.includes(framework)) window.__trialFlashes.push(framework);
          }
          if (!window.__trialStop) requestAnimationFrame(watch);
        };
        requestAnimationFrame(watch);
      });
      // Scripts are held until the server HTML has been checked.
      let release;
      const gate = new Promise(resolve => (release = resolve));
      await page.route(/\.(m?js|ts|tsx|svelte)(\?.*)?$/, async route => {
        await gate;
        await route.continue();
      });
      // A module script would hold DOMContentLoaded: the page is read once its HTML and its styles are in.
      await page.goto(`${base}${PAGE}`, { waitUntil: 'commit' });
      await page.locator('[data-trial="svelte"] [data-trial-part="closed"] [data-trial-details]').waitFor({ state: 'attached' });
      await page.waitForFunction(() => [...document.querySelectorAll('link[rel="stylesheet"]')].every(link => link.sheet));
      await page.waitForTimeout(500);

      // Nothing has hydrated: every island still waits for its scripts.
      assert.equal(await page.locator('astro-island:not([ssr])').count(), 0, 'no island has hydrated yet');
      for (const framework of FRAMEWORKS) {
        const details = page.locator(`[data-trial="${framework}"] [data-trial-part="closed"] [data-trial-details]`);
        assert.equal(await details.count(), 1, `${framework}: the details are in the server HTML`);
        assert.equal(await details.isVisible(), false, `${framework}: the closed details are not drawn before any script runs`);
        const markup = await details.evaluate(el => el.closest('[hidden]')?.outerHTML.slice(0, 160) ?? null);
        assert.ok(markup, `${framework}: the details sit in a hidden element`);
      }

      release();
      await settle(page);
      await page.evaluate(() => (window.__trialStop = true));
      assert.deepEqual(await page.evaluate(() => window.__trialFlashes), [], 'no closed details drawn before or during hydration');

      for (const framework of FRAMEWORKS) {
        const part = page.locator(`[data-trial="${framework}"] [data-trial-part="closed"]`);
        const details = part.locator('[data-trial-details]');
        assert.equal(await details.isVisible(), false, `${framework}: still closed once hydrated`);
        // The host: the element that is hidden, which carries the state.
        const host = await details.evaluateHandle(el => el.closest('[hidden]'));

        // Open (a click may come before the island has bound its handler: click until it opens).
        for (let attempt = 0; attempt < 20 && !(await details.isVisible()); attempt++) {
          await part.getByRole('button', { name: 'Open the details', exact: true }).click();
          await page.waitForTimeout(30);
          if (!(await details.isVisible())) await page.waitForTimeout(300);
        }
        assert.equal(await details.isVisible(), true, `${framework}: opened`);
        const opened = await host.evaluate(el => ({
          hidden: el.hidden,
          presence: el.getAttribute('data-motion-presence'),
          inert: el.hasAttribute('inert'),
        }));
        assert.deepEqual({ hidden: opened.hidden, inert: opened.inert }, { hidden: false, inert: false }, `${framework}: the host is shown`);
        assert.ok(['entering', 'present'].includes(opened.presence), `${framework}: the host carries the presence (${opened.presence})`);
        const box = await boxOf(host);
        const entry = await animations(box);
        assert.ok(entry.own.length > 0 || opened.presence === 'present', `${framework}: the box plays the entry (${entry.own})`);
        assert.equal(await box.evaluate(el => el.hasAttribute('data-motion-presence')), framework === 'svelte', `${framework}: the state is on the host`);
        await page.waitForFunction(el => el.getAttribute('data-motion-presence') === 'present', host, { timeout: 5000 });

        // Close: the host is hidden and inert at once, its box plays the exit while drawn, then it is not drawn.
        await part.getByRole('button', { name: 'Close the details', exact: true }).click();
        await page.waitForTimeout(30);
        const closing = await host.evaluate(el => ({ hidden: el.hidden, presence: el.getAttribute('data-motion-presence'), inert: el.hasAttribute('inert') }));
        assert.deepEqual(closing, { hidden: true, presence: 'exiting', inert: true }, `${framework}: the host is hidden, exiting and inert`);
        const exit = await animations(box);
        assert.ok(exit.own.length > 0, `${framework}: the box plays the exit (${exit.own})`);
        assert.equal(await details.isVisible(), true, `${framework}: drawn while its exit plays`);
        await page.waitForFunction(el => el.getBoundingClientRect().height === 0, await details.elementHandle(), { timeout: 5000 });
        assert.equal(await details.isVisible(), false, `${framework}: hidden once its exit has played`);
      }
      assert.deepEqual(errors, []);

      // Reduced motion: opening and closing at once, the host still carries the state, and hidden still hides it.
      await page.emulateMedia({ reducedMotion: 'reduce' });
      for (const framework of FRAMEWORKS) {
        const part = page.locator(`[data-trial="${framework}"] [data-trial-part="closed"]`);
        const details = part.locator('[data-trial-details]');
        await part.getByRole('button', { name: 'Open the details', exact: true }).click();
        await page.waitForFunction(el => el.getBoundingClientRect().height > 0, await details.elementHandle(), { timeout: 5000 });
        await part.getByRole('button', { name: 'Close the details', exact: true }).click();
        await page.waitForFunction(el => el.getBoundingClientRect().height === 0, await details.elementHandle(), { timeout: 5000 });
        assert.equal(await details.evaluate(el => el.closest('[hidden]')?.hasAttribute('inert')), true, `${framework}: reduced, the host is inert`);
      }
    } finally {
      await browser.close();
    }
  });
}
