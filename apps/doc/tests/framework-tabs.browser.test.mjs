// Run against a built or dev site: MOTION_BROWSERS=chromium MOTION_DOC_URL=http://127.0.0.1:4381 node --test --test-concurrency=1 tests/framework-tabs.browser.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium, firefox, webkit } from 'playwright';

const base = process.env.MOTION_DOC_URL ?? 'http://localhost:4322';
const browserTypes = { chromium, firefox, webkit };
const browsers = (process.env.MOTION_BROWSERS ?? 'chromium').split(',').map(name => name.trim());

/** The framework the reader chose, as the site stores it (stores/exampleFrameworkStore). */
const STORAGE_KEY = 'udixio:docs:preferred-example-framework';

/**
 * Holds the scripts of a page until the returned function is called. The framework tabs are in the server-rendered page and
 * can take the focus, but the islands that make them live have not run yet: that is the window this test is about.
 */
async function holdScripts(page) {
  const held = [];
  let released = false;
  await page.route('**/*', async route => {
    if (!released && route.request().resourceType() === 'script') {
      held.push(route);
      return;
    }
    await route.continue();
  });
  return async () => {
    released = true;
    await Promise.all(held.splice(0).map(route => route.continue()));
  };
}

/** The id of the focused element, or its tag name when it has none (the body, when the focus was lost). */
const focusedName = page => page.evaluate(() => document.activeElement?.id || document.activeElement?.tagName || 'none');

/** Waits until the tab of `selector` is out of its `data-code-ssr` wrapper: the island has applied the stored choice. */
const tabsAreLive = (page, selector) =>
  page.waitForFunction(
    query => {
      const tab = document.querySelector(query);
      return tab !== null && tab.closest('[data-code-ssr]') === null;
    },
    selector,
    { timeout: 30000 },
  );

for (const name of browsers) {
  if (!Object.hasOwn(browserTypes, name)) throw new Error(`Unknown MOTION_BROWSERS entry: ${name}`);
  const browserType = browserTypes[name];

  test(`${name}: a code tab focused before hydration keeps the focus once the tabs are live`, async () => {
    const browser = await browserType.launch();
    try {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      await context.addInitScript(key => {
        try {
          window.localStorage.setItem(key, 'angular');
        } catch {
          // The storage is not available: the page reads React, and the test then checks nothing about the choice.
        }
      }, STORAGE_KEY);
      const page = await context.newPage();
      const release = await holdScripts(page);

      await page.goto(base + '/motion/', { waitUntil: 'commit' });
      await page.waitForSelector('#principle-tab-html');
      await page.locator('#principle-tab-html').focus();
      assert.equal(await focusedName(page), 'principle-tab-html', 'the code tab takes the focus before hydration');

      await release();
      await tabsAreLive(page, '#principle-tab-angular');

      assert.equal(await page.locator('#principle-tab-angular').getAttribute('aria-selected'), 'true', 'the stored choice is selected');
      assert.equal(await focusedName(page), 'principle-tab-html', 'the focus is lost when the code tabs hydrate');
    } finally {
      await browser.close();
    }
  });

  test(`${name}: a framework switch radio focused before hydration keeps the focus once the switch is live`, async () => {
    const browser = await browserType.launch();
    try {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      await context.addInitScript(key => {
        try {
          window.localStorage.setItem(key, 'angular');
        } catch {
          // See above.
        }
      }, STORAGE_KEY);
      const page = await context.newPage();
      const release = await holdScripts(page);

      await page.goto(base + '/motion/presets/', { waitUntil: 'commit' });
      await page.waitForSelector('[data-framework-choice="html"]');
      await page.locator('[data-framework-choice="html"]').focus();
      assert.equal(
        await page.evaluate(() => document.activeElement?.getAttribute('data-framework-choice') ?? null),
        'html',
        'the switch radio takes the focus before hydration',
      );

      await release();
      await tabsAreLive(page, '[data-framework-choice="angular"]');

      // The switch is a radio group: the stored choice is checked.
      assert.equal(
        await page.locator('[data-framework-choice="angular"]').getAttribute('aria-checked'),
        'true',
        'the stored choice is checked',
      );
      const focused = await page.evaluate(() => document.activeElement?.getAttribute('data-framework-choice') ?? null);
      assert.equal(focused, 'html', 'the focus is lost when the switch hydrates');
    } finally {
      await browser.close();
    }
  });
}
