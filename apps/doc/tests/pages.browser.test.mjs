// Run against a built site: MOTION_BROWSERS=chromium,firefox,webkit MOTION_DOC_URL=http://localhost:4322 node --test tests/pages.browser.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium, firefox, webkit } from 'playwright';

const base = process.env.MOTION_DOC_URL ?? 'http://localhost:4322';
const browserTypes = { chromium, firefox, webkit };
const browsers = (process.env.MOTION_BROWSERS ?? 'chromium').split(',').map(name => name.trim());

/** The motion documentation: every page loads, with no page error, and the families' live examples hydrate. */
const motionPages = [
  '/motion',
  '/motion/roadmap',
  '/motion/getting-started',
  '/motion/presets',
  '/motion/presence',
  '/motion/emphasis',
  '/motion/layout',
  '/motion/reveal-scrub-loop',
  '/motion/values',
  '/motion/sequences',
  '/motion/gestures',
  '/motion/page-transitions',
  '/motion/text',
  '/motion/svg',
  '/motion/scroll',
  '/motion/animate',
  '/motion/scopes',
  '/motion/accessibility',
  '/motion/tokens',
  '/motion/limits',
  '/motion/demo',
];

/** The pages that carry islands: the home page, the theme builder, and the overview and API pages of the components that failed. */
const islandPages = [
  '/',
  '/theme/builder/',
  ...['tabs', 'navigation-rail', 'date-picker', 'slider', 'tooltip', 'fab', 'carousel'].flatMap(name => [
    `/components/${name}/overview/`,
    `/components/${name}/api/`,
  ]),
];

/** Messages of a hydration mismatch, in the development build and the production one (minified error #418). */
const HYDRATION = /hydrat|did not match|didn't match|Minified React error #418|#418/;

/**
 * Records the errors of the page from its first script on: an uncaught exception, and a `reportError` call (which React
 * uses for a recoverable hydration error in production) both end up in `window.__udxErrors`.
 */
async function recordErrors(page) {
  await page.addInitScript(() => {
    window.__udxErrors = [];
    window.addEventListener('error', event => window.__udxErrors.push(String(event.message ?? event.error)));
  });
  const found = [];
  page.on('pageerror', error => found.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && HYDRATION.test(message.text())) found.push(message.text());
  });
  // Returns the errors of the page since the last call, and forgets them.
  return async () => {
    found.push(...(await page.evaluate(() => window.__udxErrors ?? [])));
    return found.splice(0, found.length);
  };
}

/**
 * Lets every island hydrate: the page is scrolled once so that the islands loaded on visibility are reached, then the wait
 * is for the islands to lose their `ssr` marker, which Astro removes when an island has hydrated.
 */
async function settle(page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) {
      window.scrollTo(0, y);
      await new Promise(resolve => setTimeout(resolve, 40));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForFunction(() => document.querySelectorAll('astro-island[ssr]').length === 0, null, { timeout: 30000 });
  await page.waitForTimeout(300);
}

/** The first keyboard-focused element is drawn with a visible outline: its style is not none and its width is not zero. */
async function expectVisibleFocus(locator, label) {
  const focus = await locator.evaluate(element => ({
    focusVisible: element.matches(':focus-visible'),
    style: getComputedStyle(element).outlineStyle,
    width: Number.parseFloat(getComputedStyle(element).outlineWidth),
  }));
  assert.equal(focus.focusVisible, true, `${label} is not focus-visible`);
  assert.notEqual(focus.style, 'none', `${label} has no outline when focused`);
  assert.ok(focus.width >= 2, `${label} outline is ${focus.width} px wide, expected at least 2 px`);
}

for (const name of browsers) {
  if (!Object.hasOwn(browserTypes, name)) throw new Error(`Unknown MOTION_BROWSERS entry: ${name}`);
  const browserType = browserTypes[name];

  test(`${name}: island pages hydrate without a page error or a hydration mismatch`, async () => {
    const browser = await browserType.launch();
    try {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const page = await context.newPage();
      const errors = await recordErrors(page);
      const failures = [];
      for (const path of islandPages) {
        const response = await page.goto(base + path, { waitUntil: 'load' });
        assert.equal(response.status(), 200, path);
        await settle(page);
        const found = await errors();
        if (found.length > 0) failures.push(`${path}: ${[...new Set(found)].join(' | ').slice(0, 400)}`);
      }
      assert.deepEqual(failures, []);
    } finally { await browser.close(); }
  });

  for (const width of [1280, 375]) {
    test(`${name}: the carousel's Previous and Next buttons are reachable at ${width} px`, async () => {
      const browser = await browserType.launch();
      try {
        const page = await browser.newPage({ viewport: { width, height: 900 } });
        await page.goto(base + '/components/carousel/overview/', { waitUntil: 'load' });
        await settle(page);
        const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        assert.ok(documentWidth <= width, `the document is ${documentWidth} px wide at a ${width} px viewport`);
        for (const label of ['Previous', 'Next']) {
          const button = page.getByRole('button', { name: label, exact: true }).first();
          const box = await button.boundingBox();
          assert.ok(box, `${label} has no box`);
          assert.ok(box.x >= 0 && box.x + box.width <= width, `${label} spans ${box.x}..${box.x + box.width} px, outside the ${width} px viewport`);
        }
        await page.getByRole('button', { name: 'Next', exact: true }).first().click();
        await page.getByRole('button', { name: 'Previous', exact: true }).first().click();
      } finally { await browser.close(); }
    });
  }

  test(`${name}: the token gallery opens its first group on load`, async () => {
    const browser = await browserType.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      await page.goto(base + '/', { waitUntil: 'load' });
      await settle(page);
      await page.getByRole('tab', { name: 'Colors', exact: true }).click();
      await page.waitForFunction(() => [...document.querySelectorAll('h3')].some(h => h.classList.contains('capitalize')), null, { timeout: 30000 });
      const first = await page.evaluate(() => {
        const heading = [...document.querySelectorAll('h3')].find(h => h.classList.contains('capitalize'));
        // The header row holds the heading and the Show / Hide label.
        return { group: heading.textContent, label: heading.parentElement.parentElement.textContent };
      });
      assert.match(first.label, /Hide/, `the first group "${first.group}" starts collapsed`);
    } finally { await browser.close(); }
  });

  test(`${name}: the chat input and the tab of the hero draw a focus outline`, async () => {
    const browser = await browserType.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      await page.goto(base + '/', { waitUntil: 'load' });
      await settle(page);
      const input = page.getByPlaceholder('Message...');
      await input.focus();
      await expectVisibleFocus(input, 'The chat input');
      const tab = page.getByRole('tab', { name: 'Colors', exact: true });
      await tab.focus();
      await expectVisibleFocus(tab, 'The Colors tab');
    } finally { await browser.close(); }
  });

  test(`${name}: every motion page loads without a page error`, async () => {
    const browser = await browserType.launch();
    try {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const page = await context.newPage();
      const errors = await recordErrors(page);
      const failures = [];
      for (const path of motionPages) {
        const response = await page.goto(base + path, { waitUntil: 'load' });
        assert.equal(response.status(), 200, path);
        await settle(page);
        const found = await errors();
        if (found.length > 0) failures.push(`${path}: ${[...new Set(found)].join(' | ').slice(0, 400)}`);
      }
      assert.deepEqual(failures, []);
    } finally { await browser.close(); }
  });

  test(`${name}: the motion manifest is served as JSON and llms.txt points to it`, async () => {
    const browser = await browserType.launch();
    try {
      const page = await browser.newPage();
      const manifest = await page.request.get(base + '/motion-manifest.json');
      assert.equal(manifest.status(), 200);
      assert.match(manifest.headers()['content-type'], /application\/json/);
      const data = await manifest.json();
      assert.equal(data.version, 1);
      assert.ok(Object.hasOwn(data.presets, 'fade'), 'the manifest lists the presets');
      const llms = await page.request.get(base + '/llms.txt');
      assert.equal(llms.status(), 200);
      assert.match(await llms.text(), /\/motion-manifest\.json/);
    } finally { await browser.close(); }
  });
}
