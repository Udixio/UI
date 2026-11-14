// Run against a built site: MOTION_BROWSERS=chromium,firefox,webkit MOTION_DOC_URL=http://localhost:4322 node --test tests/motion.browser.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium, firefox, webkit } from 'playwright';

const base = process.env.MOTION_DOC_URL ?? 'http://localhost:4322';
const browserTypes = { chromium, firefox, webkit };
const browsers = (process.env.MOTION_BROWSERS ?? 'chromium').split(',').map(name => name.trim());
for (const name of browsers) {
  if (!Object.hasOwn(browserTypes, name)) throw new Error(`Unknown MOTION_BROWSERS entry: ${name}`);
  const browserType = browserTypes[name];
test(`${name}: Motion works without JavaScript and applies reduced-motion policy`, async () => {
  const browser = await browserType.launch();
  try {
    const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    for (const path of ['/motion/', '/motion/roadmap/', '/motion/tokens/', '/motion/accessibility/', '/motion/demo/', '/animations/']) {
      assert.equal((await page.goto(base + path)).status(), 200, path);
    }
    await page.goto(base + '/motion/');
    const navigation = page.getByRole('navigation', { name: 'Motion documentation' });
    const overview = navigation.getByRole('link', { name: 'Overview' });
    await overview.focus();
    await page.keyboard.press('Tab');
    assert.equal(await navigation.getByRole('link', { name: 'Roadmap' }).evaluate(el => el === document.activeElement), true);
    await Promise.all([page.waitForURL('**/motion/roadmap/'), page.keyboard.press('Enter')]);
    assert.match(page.url(), /\/motion\/roadmap\/?$/);
    await page.goto(base + '/motion/accessibility/');
    const toggle = page.getByLabel('Change the decorative swatch');
    const reduce = page.getByLabel('Reduce motion in this demonstration');
    const swatch = page.locator('.swatch');
    await toggle.focus(); await page.keyboard.press('Space');
    assert.equal(await toggle.isChecked(), true);
    const deadline = Date.now() + 5000;
    let opacity;
    do {
      opacity = await swatch.evaluate(el => getComputedStyle(el).opacity);
      if (opacity === '1') break;
      await new Promise(resolve => setTimeout(resolve, 50));
    } while (Date.now() < deadline);
    assert.equal(opacity, '1');
    await reduce.focus(); await page.keyboard.press('Space');
    assert.equal(await reduce.isChecked(), true);
    assert.equal(await swatch.evaluate(el => getComputedStyle(el).transitionDuration), '0s');
    await toggle.focus(); await page.keyboard.press('Space');
    assert.equal(await toggle.isChecked(), false);
    assert.equal(await swatch.evaluate(el => getComputedStyle(el).opacity), '0.35');
    for (const [policy, expected] of [['reduce', '0'], ['auto', '1'], ['unknown', '1'], ['', '1']]) {
      await page.evaluate(value => value ? document.documentElement.setAttribute('data-motion-policy', value) : document.documentElement.removeAttribute('data-motion-policy'), policy);
      assert.equal(await swatch.evaluate(el => getComputedStyle(el).getPropertyValue('--udx-motion-scale').trim()), expected);
    }
    await page.evaluate(() => document.documentElement.setAttribute('data-motion-policy', 'reduce'));
    const shadow = await page.evaluate(() => {
      const host = document.createElement('div');
      document.body.append(host);
      const span = document.createElement('span');
      host.attachShadow({ mode: 'open' }).append(span);
      const inherited = getComputedStyle(span).getPropertyValue('--udx-motion-scale').trim();
      host.style.setProperty('--udx-motion-scale', '1');
      return { inherited, overridden: getComputedStyle(span).getPropertyValue('--udx-motion-scale').trim() };
    });
    assert.deepEqual(shadow, { inherited: '0', overridden: '1' });
    const blank = await context.newPage();
    await blank.setContent('<html data-motion-policy="reduce"><body></body></html>');
    assert.equal(await blank.evaluate(() => {
      const host = document.createElement('div');
      document.body.append(host);
      const span = document.createElement('span');
      host.attachShadow({ mode: 'open' }).append(span);
      return getComputedStyle(span).getPropertyValue('--udx-motion-scale').trim();
    }), '');
    await blank.close();
    await page.evaluate(() => document.documentElement.removeAttribute('data-motion-policy'));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(await swatch.evaluate(el => getComputedStyle(el).getPropertyValue('--udx-motion-scale').trim()), '0');
  } finally { await browser.close(); }
});

test(`${name}: Motion rail stays selected for both section and legacy URL`, async () => {
  const browser = await browserType.launch();
  try {
    const page = await browser.newPage();
    await page.goto(base + '/motion/');
    await page.getByRole('navigation', { name: 'Motion documentation' }).getByRole('link', { name: 'Roadmap' }).click();
    await page.waitForFunction(() => location.pathname.startsWith('/motion/roadmap'));
    await page.waitForFunction(() => document.title.toLowerCase().includes('roadmap'));
    assert.match(await page.title(), /roadmap/i);
    const rail = page.locator('a.navigation-rail-item[href="/motion"]');
    await page.waitForFunction(() => document.querySelector('a[href="/motion"][aria-current="page"]') !== null);
    assert.equal(await rail.getAttribute('aria-current'), 'page');
    await page.getByRole('navigation', { name: 'Motion documentation' }).getByRole('link', { name: 'Existing animations' }).click();
    await page.waitForFunction(() => location.pathname.startsWith('/animations'));
    await page.waitForFunction(() => document.title.startsWith('Animations'));
    await page.waitForFunction(() => document.querySelector('a[href="/motion"][aria-current="page"]') !== null);
    assert.equal(await rail.getAttribute('aria-current'), 'page');
    await rail.evaluate(el => el.setAttribute('data-test-persisted', 'yes'));
    await page.getByRole('link', { name: 'Get started', exact: true }).click();
    await page.waitForFunction(() => location.pathname.startsWith('/get-started/introduction'));
    await page.waitForFunction(() => document.querySelector('a[href="/motion"][aria-current="page"]') === null);
    assert.equal(await rail.getAttribute('data-test-persisted'), 'yes');
    assert.notEqual(await rail.getAttribute('aria-current'), 'page');
    await rail.click();
    await page.waitForFunction(() => location.pathname === '/motion' || location.pathname === '/motion/');
    await page.waitForFunction(() => document.querySelector('a[href="/motion"][aria-current="page"]') !== null);
    assert.equal(await rail.getAttribute('data-test-persisted'), 'yes');
    assert.equal(await rail.getAttribute('aria-current'), 'page');
    for (const path of ['/motion/', '/motion/roadmap/', '/animations/']) {
      await page.goto(base + path);
      await page.waitForSelector('a[aria-current="page"]');
      assert.equal(await page.getByRole('link', { name: 'Motion', exact: true }).getAttribute('aria-current'), 'page', path);
    }
  } finally { await browser.close(); }
});

test(`${name}: the data-motion demo hides and shows its cards`, async () => {
  const browser = await browserType.launch();
  try {
    const context = await browser.newContext({ reducedMotion: 'no-preference' });
    const page = await context.newPage();
    const pageErrors = [];
    const motionErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error' && message.text().includes('@udixio/motion')) motionErrors.push(message.text());
    });
    await page.goto(base + '/motion/demo/');
    await page.waitForFunction(() => document.querySelector('[data-motion="fade"]')?.getAttribute('data-presence') === 'present');
    await page.getByRole('button', { name: 'Hide cards' }).click();
    const hiding = await page.evaluate(() => {
      const card = document.querySelector('[data-motion="fade"]');
      return { hidden: card.hasAttribute('hidden'), inert: card.hasAttribute('inert'), display: getComputedStyle(card).display };
    });
    assert.equal(hiding.hidden, true);
    assert.equal(hiding.inert, true);
    assert.notEqual(hiding.display, 'none');
    await page.waitForFunction(() => getComputedStyle(document.querySelector('[data-motion="fade"]')).display === 'none');
    assert.equal(await page.locator('[data-motion="fade"]').evaluate(el => el.hasAttribute('hidden')), true);
    await page.getByRole('button', { name: 'Show cards' }).click();
    await page.waitForFunction(() => {
      const card = document.querySelector('[data-motion="fade"]');
      return card.getAttribute('data-presence') === 'present' && !card.hasAttribute('inert');
    });
    const shown = await page.locator('[data-motion="fade"]').evaluate(el => ({ hidden: el.hasAttribute('hidden'), opacity: getComputedStyle(el).opacity }));
    assert.equal(shown.hidden, false);
    assert.equal(shown.opacity, '1');
    const reduce = page.getByLabel('Reduce motion on this page');
    await reduce.check();
    assert.equal(await page.evaluate(() => document.documentElement.getAttribute('data-motion-policy')), 'reduce');
    await reduce.uncheck();
    assert.equal(await page.evaluate(() => document.documentElement.hasAttribute('data-motion-policy')), false);
    assert.deepEqual(pageErrors, []);
    assert.deepEqual(motionErrors, []);
  } finally { await browser.close(); }
});

test(`${name}: framework adapters play the exit before removing the card`, async () => {
  const browser = await browserType.launch();
  try {
    const context = await browser.newContext({ reducedMotion: 'no-preference' });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto(base + '/motion/demo/');
    for (const label of ['React', 'Angular', 'Svelte']) {
      const key = label.toLowerCase();
      const card = '[data-demo-card="' + key + '"]';
      const toggle = page.getByRole('button', { name: 'Toggle ' + label + ' card' });
      await page.waitForSelector(card);
      await page.waitForFunction(selector => document.querySelector(selector)?.getAttribute('data-presence') === 'present', card);
      // Recorded in the page: a framework may start the exit a task after the click.
      await page.evaluate(selector => {
        const element = document.querySelector(selector);
        window.__exitSeen = false;
        new MutationObserver(() => {
          if (element.isConnected && element.getAttribute('data-presence') === 'exiting') window.__exitSeen = true;
        }).observe(element, { attributes: true, attributeFilter: ['data-presence'] });
      }, card);
      await toggle.click();
      await page.waitForFunction(selector => document.querySelector(selector) === null, card);
      assert.equal(await page.evaluate(() => window.__exitSeen), true, label + ' card removed without playing its exit');
      await toggle.click();
      await page.waitForFunction(selector => document.querySelector(selector)?.getAttribute('data-presence') === 'present', card);
    }
    assert.deepEqual(pageErrors, []);
  } finally { await browser.close(); }
});
}
