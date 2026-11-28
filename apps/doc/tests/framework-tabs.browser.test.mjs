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


  /** The four links of the switch that holds `bare`, a path of a motion page without its prefix. */
  const switchOf = (page, bare) => page.locator(`[role="tablist"]:has(a[role="tab"][href="/svelte${bare}"])`);
  const linkTo = (page, bare, framework) => switchOf(page, bare).locator(`a[role="tab"][href="/${framework}${bare}"]`);
  const pathOf = page => new URL(page.url()).pathname.replace(/\/+$/, '');
  const waitForPath = (page, path) =>
    page.waitForFunction(expected => location.pathname.replace(/\/+$/, '') === expected, path, { timeout: 30000 });
  const GUIDE = '/motion/presence/guide';
  const EXAMPLES = '/motion/presence/examples';

  test(`${name}: the switch is four links in a tablist, the reading's own framework selected`, async () => {
    const browser = await browserType.launch();
    try {
      const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
      await page.goto(base + '/react/motion/presence/guide/', { waitUntil: 'load' });
      const links = switchOf(page, GUIDE).locator('a[role="tab"]');
      assert.deepEqual(
        await links.evaluateAll(elements => elements.map(element => element.getAttribute('href'))),
        ['html', 'react', 'angular', 'svelte'].map(framework => `/${framework}${GUIDE}`),
        'one link per framework, in order',
      );
      assert.equal(await linkTo(page, GUIDE, 'react').getAttribute('aria-selected'), 'true', 'the reading is selected');
      assert.equal(await linkTo(page, GUIDE, 'react').getAttribute('aria-current'), 'page', 'the reading is the current page');
      assert.equal(await linkTo(page, GUIDE, 'svelte').getAttribute('aria-selected'), 'false', 'another framework is not selected');
    } finally {
      await browser.close();
    }
  });

  test(`${name}: a Svelte reading selects Svelte in the switch, whatever the stored choice`, async () => {
    const browser = await browserType.launch();
    try {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      await context.addInitScript(key => window.localStorage.setItem(key, 'react'), STORAGE_KEY);
      const page = await context.newPage();
      await page.goto(base + '/svelte/motion/presence/guide/', { waitUntil: 'load' });
      assert.equal(await linkTo(page, GUIDE, 'svelte').getAttribute('aria-selected'), 'true', 'Svelte is selected');
      assert.equal(await linkTo(page, GUIDE, 'react').getAttribute('aria-selected'), 'false', 'React is not selected');
    } finally {
      await browser.close();
    }
  });

  test(`${name}: the switch works without JavaScript`, async () => {
    const browser = await browserType.launch();
    try {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, javaScriptEnabled: false });
      const page = await context.newPage();
      await page.goto(base + '/react/motion/presence/guide/', { waitUntil: 'load' });
      assert.equal(await linkTo(page, GUIDE, 'svelte').isVisible(), true, 'the switch is drawn without JavaScript');
      await linkTo(page, GUIDE, 'svelte').click();
      await waitForPath(page, '/svelte' + GUIDE);
      assert.equal(await linkTo(page, GUIDE, 'svelte').getAttribute('aria-selected'), 'true', 'the Svelte reading selects Svelte');
    } finally {
      await browser.close();
    }
  });

  test(`${name}: a switch keeps the tab`, async () => {
    const browser = await browserType.launch();
    try {
      const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
      await page.goto(base + '/react/motion/presence/examples/', { waitUntil: 'load' });
      await linkTo(page, EXAMPLES, 'svelte').click();
      await waitForPath(page, '/svelte' + EXAMPLES);
    } finally {
      await browser.close();
    }
  });

  test(`${name}: a switch keeps the heading under the reader and the hash`, async () => {
    const browser = await browserType.launch();
    try {
      const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
      await page.goto(base + '/react/motion/presence/guide/#options', { waitUntil: 'load' });
      const heading = page.locator('h2[id]').nth(2);
      const id = await heading.getAttribute('id');
      await heading.evaluate(element => element.scrollIntoView({ block: 'start', behavior: 'instant' }));
      const before = await heading.evaluate(element => element.getBoundingClientRect().top);
      await linkTo(page, GUIDE, 'svelte').click();
      await waitForPath(page, '/svelte' + GUIDE);
      const after = await page.evaluate(sectionId => document.getElementById(sectionId)?.getBoundingClientRect().top ?? Number.NaN, id);
      assert.ok(Math.abs(after - before) <= 4, `the heading moved from ${before} to ${after}`);
      assert.equal(new URL(page.url()).hash, '#options', 'the hash is kept');
    } finally {
      await browser.close();
    }
  });

  test(`${name}: Back returns to the framework left`, async () => {
    const browser = await browserType.launch();
    try {
      const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
      await page.goto(base + '/react/motion/presence/guide/', { waitUntil: 'load' });
      await linkTo(page, GUIDE, 'svelte').click();
      await waitForPath(page, '/svelte' + GUIDE);
      await page.goBack();
      await waitForPath(page, '/react' + GUIDE);
    } finally {
      await browser.close();
    }
  });

  test(`${name}: a click on the switch stores the choice`, async () => {
    const browser = await browserType.launch();
    try {
      const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
      await page.goto(base + '/react/motion/presence/guide/', { waitUntil: 'load' });
      await linkTo(page, GUIDE, 'angular').click();
      await waitForPath(page, '/angular' + GUIDE);
      assert.equal(await page.evaluate(key => window.localStorage.getItem(key), STORAGE_KEY), 'angular', 'the choice is stored');
    } finally {
      await browser.close();
    }
  });
}
