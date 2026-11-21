// Run against a built site: MOTION_BROWSERS=chromium,firefox,webkit MOTION_DOC_URL=http://localhost:4322 node --test tests/components-showcase.browser.test.mjs
// The components section of the root animation page (`components/motion/root/Components.astro`): real Udixio components
// that play a short script by themselves, pause for the visitor, and rest under reduced motion.
// MOTION_SHOWCASE_PATH points the suite at another page that mounts the section (default: /motion/).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium, firefox, webkit } from 'playwright';

const base = process.env.MOTION_DOC_URL ?? 'http://localhost:4322';
const path = process.env.MOTION_SHOWCASE_PATH ?? '/motion/';
const browserTypes = { chromium, firefox, webkit };
const browsers = (process.env.MOTION_BROWSERS ?? 'chromium').split(',').map(name => name.trim());

/** The tiles, with the page each one links to. */
const tiles = {
  tabs: '/components/tabs/overview/',
  snackbar: '/components/snackbar/overview/',
  'side-sheet': '/components/side-sheet/overview/',
  'navigation-rail': '/components/navigation-rail/overview/',
};

/** The longest hold of a script beat (ms): a tile that plays changes state within it. */
const LONGEST_BEAT = 2400;

/** Records page errors and console errors from the first script on (the dev server's dependency reloads aside). */
function recordErrors(page) {
  const found = [];
  page.on('pageerror', error => found.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && !/Outdated Optimize Dep/.test(message.text())) found.push(message.text());
  });
  return () => found.splice(0, found.length);
}

/**
 * Opens the page, waits for the section's islands to hydrate (each tile is brought into view once: they hydrate when
 * visible), then shows the top of the section with the pointer away from it.
 */
async function openSection(page) {
  const response = await page.goto(base + path, { waitUntil: 'load' });
  assert.equal(response.status(), 200, path);
  const section = page.locator('[data-components-showcase]');
  await page.mouse.move(1, 1);
  for (const tile of await section.locator('[data-showcase]').all()) await tile.scrollIntoViewIfNeeded();
  await section.scrollIntoViewIfNeeded();
  await page.waitForFunction(
    () => {
      const section = document.querySelector('[data-components-showcase]');
      return section && section.querySelectorAll('astro-island[ssr]').length === 0;
    },
    null,
    { timeout: 30000 },
  );
  await page.locator('[data-showcase="tabs"]').scrollIntoViewIfNeeded();
  return section;
}

const tileLocator = (page, name) => page.locator(`[data-showcase="${name}"]`);
const statusOf = (page, name) => tileLocator(page, name).getAttribute('data-autoplay');
/** The index of the selected tab of the Tabs tile. */
const selectedTab = page =>
  tileLocator(page, 'tabs').evaluate(tile =>
    [...tile.querySelectorAll('[role="tab"]')].findIndex(tab => tab.getAttribute('aria-selected') === 'true'),
  );

/** Waits until the given tile reports the given status. */
async function waitForStatus(page, name, status) {
  await page.waitForFunction(
    ([name, status]) => document.querySelector(`[data-showcase="${name}"]`)?.getAttribute('data-autoplay') === status,
    [name, status],
    { timeout: 10000 },
  );
}

for (const name of browsers) {
  if (!Object.hasOwn(browserTypes, name)) throw new Error(`Unknown MOTION_BROWSERS entry: ${name}`);
  const browserType = browserTypes[name];

  for (const width of [1280, 375]) {
    test(`${name}: the tiles render the real components, each linked to its page, inside the viewport at ${width} px`, async () => {
      const browser = await browserType.launch();
      try {
        const page = await browser.newPage({ viewport: { width, height: 900 } });
        const errors = recordErrors(page);
        const section = await openSection(page);
        // The components themselves, by their roles.
        const tabs = tileLocator(page, 'tabs');
        assert.equal(await tabs.getByRole('tablist').count(), 1, 'the Tabs tile has no tablist');
        assert.equal(await tabs.getByRole('tab').count(), 3, 'the Tabs tile does not have 3 tabs');
        assert.equal(await tileLocator(page, 'snackbar').getByRole('status').count(), 1, 'the Snackbar tile has no status');
        assert.equal(await tileLocator(page, 'side-sheet').getByRole('button', { name: /^Close Info$/ }).count(), 1, 'the side sheet has no close button');
        assert.equal(await tileLocator(page, 'navigation-rail').getByRole('button', { name: /menu/i }).count(), 1, 'the rail has no menu button');
        for (const [tile, href] of Object.entries(tiles)) {
          assert.equal(await tileLocator(page, tile).count(), 1, `no ${tile} tile`);
          assert.equal(await section.locator(`a[href="${href}"]`).count(), 1, `no link to ${href}`);
        }
        const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        assert.ok(documentWidth <= width, `the document is ${documentWidth} px wide at a ${width} px viewport`);
        assert.deepEqual(errors(), []);
      } finally { await browser.close(); }
    });
  }

  test(`${name}: the Tabs tile moves its selection by itself`, async () => {
    const browser = await browserType.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      await openSection(page);
      await waitForStatus(page, 'tabs', 'playing');
      const first = await selectedTab(page);
      await page.waitForFunction(
        first => [...document.querySelectorAll('[data-showcase="tabs"] [role="tab"]')]
          .findIndex(tab => tab.getAttribute('aria-selected') === 'true') !== first,
        first,
        { timeout: LONGEST_BEAT * 2 },
      );
      for (const tile of Object.keys(tiles)) assert.equal(await statusOf(page, tile), 'playing', `${tile} is not playing`);
    } finally { await browser.close(); }
  });

  test(`${name}: hovering a tile pauses it, leaving it resumes it`, async () => {
    const browser = await browserType.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      await openSection(page);
      await waitForStatus(page, 'tabs', 'playing');
      await tileLocator(page, 'tabs').hover();
      await waitForStatus(page, 'tabs', 'paused');
      const held = await selectedTab(page);
      await page.waitForTimeout(LONGEST_BEAT + 800);
      assert.equal(await selectedTab(page), held, 'the selection moved while the tile was hovered');
      // The other tiles go on.
      assert.equal(await statusOf(page, 'snackbar'), 'playing');
      await page.mouse.move(1, 1);
      await waitForStatus(page, 'tabs', 'playing');
    } finally { await browser.close(); }
  });

  test(`${name}: the section's Pause button holds every tile, and Play resumes them`, async () => {
    const browser = await browserType.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      await openSection(page);
      await waitForStatus(page, 'tabs', 'playing');
      await page.getByRole('button', { name: 'Pause the demos' }).click();
      await page.mouse.move(1, 1);
      for (const tile of Object.keys(tiles)) await waitForStatus(page, tile, 'paused');
      await page.getByRole('button', { name: 'Play the demos' }).click();
      await page.mouse.move(1, 1);
      for (const tile of Object.keys(tiles)) await waitForStatus(page, tile, 'playing');
    } finally { await browser.close(); }
  });

  test(`${name}: the site's reduced-motion policy stops every tile at rest, still usable`, async () => {
    const browser = await browserType.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      await openSection(page);
      await waitForStatus(page, 'tabs', 'playing');
      await page.evaluate(() => document.documentElement.setAttribute('data-motion-policy', 'reduce'));
      for (const tile of Object.keys(tiles)) await waitForStatus(page, tile, 'stopped');
      // At rest: the first tab, the snackbar shown.
      assert.equal(await selectedTab(page), 0);
      assert.equal(await tileLocator(page, 'snackbar').getByRole('status').getAttribute('aria-hidden'), 'false');
      await page.waitForTimeout(LONGEST_BEAT + 800);
      assert.equal(await selectedTab(page), 0, 'the selection moved under reduced motion');
      assert.equal(await page.getByRole('button', { name: 'Pause the demos' }).count(), 0, 'the Pause button stays under reduced motion');
      // Still usable: the visitor selects a tab.
      await tileLocator(page, 'tabs').getByRole('tab', { name: 'Sent' }).click();
      assert.equal(await selectedTab(page), 2);
    } finally { await browser.close(); }
  });

  test(`${name}: the system's reduced-motion setting stops every tile from the start`, async () => {
    const browser = await browserType.launch();
    try {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      await openSection(page);
      for (const tile of Object.keys(tiles)) await waitForStatus(page, tile, 'stopped');
      await page.waitForTimeout(LONGEST_BEAT + 800);
      assert.equal(await selectedTab(page), 0, 'the selection moved under reduced motion');
    } finally { await browser.close(); }
  });
}
