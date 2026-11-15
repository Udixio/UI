import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { chromium, firefox, webkit } from 'playwright';

const browserTypes = { chromium, firefox, webkit };
const browsers = (process.env.MOTION_BROWSERS ?? 'chromium,firefox,webkit')
  .split(',')
  .map((name) => name.trim());

const GROUP = '::view-transition-group(root)';
const OLD = '::view-transition-old(root)';
const NEW = '::view-transition-new(root)';

/** Start a view transition on the page and read the animations of its pseudo-elements once it is ready. */
async function transitionAnimations(page, { direction, policy }) {
  return page.evaluate(async ({ direction, policy }) => {
    const root = document.documentElement;
    if (policy === null) root.removeAttribute('data-motion-policy');
    else root.setAttribute('data-motion-policy', policy);
    if (direction === null) root.removeAttribute('data-motion-direction');
    else root.setAttribute('data-motion-direction', direction);
    const transition = document.startViewTransition(() => {
      document.querySelector('main').textContent = 'new';
    });
    // Read at ready, before any frame: the names and durations are those the transition was created with.
    await transition.ready;
    const animations = document.getAnimations()
      .filter(animation => animation.effect?.pseudoElement)
      .map(animation => ({
        pseudo: animation.effect.pseudoElement,
        name: animation.animationName ?? null,
        duration: animation.effect.getTiming().duration,
      }));
    const token = getComputedStyle(root).getPropertyValue('--udx-motion-spring-slow-spatial-duration').trim();
    transition.skipTransition();
    await transition.finished.catch(() => {});
    return { token, animations };
  }, { direction, policy });
}

/** A CSS time as milliseconds, whatever its unit. */
const toMs = (value) => (value.endsWith('ms') ? parseFloat(value) : parseFloat(value) * 1000);

/** The animations of one pseudo-element. The browser may add its own next to the route animation, so callers match by name. */
const onPseudo = (animations, pseudo) => animations.filter(animation => animation.pseudo === pseudo);

for (const name of browsers) test(`page transitions take their names and durations from the motion CSS (${name})`, async () => {
  assert.ok(Object.hasOwn(browserTypes, name), `Unsupported browser: ${name}`);
  const browser = await browserTypes[name].launch();
  try {
    const page = await browser.newPage();
    // Serve the stylesheet from a page origin: its relative @import rules fail in a
    // <style> injected into about:blank, which WebKit reports as a load error.
    await page.route('http://motion.test/**', (route) => {
      const { pathname } = new URL(route.request().url());
      if (pathname === '/') {
        return route.fulfill({
          contentType: 'text/html',
          body: '<!doctype html><link rel="stylesheet" href="/motion.css"><main>old</main>',
        });
      }
      return route.fulfill({ path: fileURLToPath(new URL(`../public${pathname}`, import.meta.url)) });
    });
    await page.goto('http://motion.test/');

    const cases = [
      { direction: 'forward', policy: null, oldName: 'udx-route-out-start', newName: 'udx-route-in-end' },
      { direction: 'back', policy: null, oldName: 'udx-route-out-end', newName: 'udx-route-in-start' },
    ];
    for (const { direction, policy, oldName, newName } of cases) {
      const { token, animations } = await transitionAnimations(page, { direction, policy });
      const expected = toMs(token);
      const detail = JSON.stringify(animations);
      assert.ok(onPseudo(animations, OLD).some(animation => animation.name === oldName), `${direction}: the old view plays ${oldName}: ${detail}`);
      assert.ok(onPseudo(animations, NEW).some(animation => animation.name === newName), `${direction}: the new view plays ${newName}: ${detail}`);
      for (const pseudo of [GROUP, OLD, NEW]) {
        const durations = onPseudo(animations, pseudo).map(animation => animation.duration);
        assert.ok(durations.length > 0, `${direction}: ${pseudo} has no animation: ${detail}`);
        assert.ok(durations.every(duration => duration === expected), `${direction}: ${pseudo} lasts ${durations} ms, the token ${token} says ${expected} ms`);
      }
    }

    // Without a direction the browser's own cross-fade plays, with the same spring duration.
    const none = await transitionAnimations(page, { direction: null, policy: null });
    for (const pseudo of [OLD, NEW]) {
      const names = onPseudo(none.animations, pseudo).map(animation => String(animation.name));
      assert.ok(names.length > 0 && names.every(name => !name.startsWith('udx-route-')), `no direction: ${pseudo} plays ${names}`);
      assert.ok(onPseudo(none.animations, pseudo).every(animation => animation.duration === toMs(none.token)), `no direction: ${pseudo} duration`);
    }

    // Reduced motion: the names stay, the scale is 0, so every duration is 0.
    const reduced = await transitionAnimations(page, { direction: 'forward', policy: 'reduce' });
    for (const pseudo of [GROUP, OLD, NEW]) {
      const durations = onPseudo(reduced.animations, pseudo).map(animation => animation.duration);
      assert.ok(durations.length > 0 && durations.every(duration => duration === 0), `reduce: ${pseudo} lasts ${durations} ms`);
    }
  } finally {
    await browser.close();
  }
});
