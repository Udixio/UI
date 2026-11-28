// Run against a dev or built site: MOTION_BROWSERS=chromium MOTION_DOC_URL=http://localhost:4400 node --test --test-concurrency=1 tests/framework-urls.browser.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium, firefox, webkit } from 'playwright';
import { motionUrl } from './motion-url.mjs';
import { MOTION_NEEDS, motionTitle } from '../src/lib/motion-nav.ts';
import { hasFrameworkVariants, splitFramework } from '../src/lib/framework-url.ts';

const base = process.env.MOTION_DOC_URL ?? 'http://localhost:4322';
const browserTypes = { chromium, firefox, webkit };
const browsers = (process.env.MOTION_BROWSERS ?? 'chromium')
  .split(',')
  .map((name) => name.trim());

/** The framework the reader chose, as the site stores it (stores/exampleFrameworkStore). */
const STORAGE_KEY = 'udixio:docs:preferred-example-framework';

/** The hrefs of the links a locator matches. */
const hrefsOf = (locator) =>
  locator.evaluateAll((links) => links.map((link) => link.getAttribute('href')));

/**
 * Every framework-dependent address of a list names `framework`, and every neutral one names none: a reading's links
 * keep the reading's framework, and a neutral page's links name the stored one once hydrated.
 */
function assertFrameworkLinks(hrefs, framework) {
  assert.ok(hrefs.length > 0, 'the list has links');
  for (const href of hrefs) {
    const found = splitFramework(href);
    if (hasFrameworkVariants(found.path))
      assert.equal(found.framework, framework, `${href} names ${framework}`);
    else assert.equal(found.framework, undefined, `${href} is a neutral page`);
  }
}

const needOf = (slug) =>
  MOTION_NEEDS.find((candidate) => candidate.slug === slug);

/** Stores `value` as the reader's framework before any script of the page runs. */
async function storeFramework(context, value) {
  await context.addInitScript(
    ([key, stored]) => {
      try {
        window.localStorage.setItem(key, stored);
      } catch {
        // The storage is not available: the stub reads React, which the test then checks.
      }
    },
    [STORAGE_KEY, value],
  );
}

for (const name of browsers) {
  if (!Object.hasOwn(browserTypes, name))
    throw new Error(`Unknown MOTION_BROWSERS entry: ${name}`);
  const browserType = browserTypes[name];

  test(`${name}: each reading of Presence answers with its framework in the title`, async () => {
    const browser = await browserType.launch();
    try {
      const page = await (await browser.newContext()).newPage();
      for (const framework of ['react', 'angular', 'svelte', 'html']) {
        const response = await page.goto(
          base + motionUrl('presence', framework, 'guide'),
        );
        assert.equal(
          response.status(),
          200,
          `the ${framework} reading answers 200`,
        );
        const expected = `${motionTitle(needOf('presence'), framework, 'guide')} — Udixio UI`;
        // The dev server may reload the page once after a change: the title is read once it has settled.
        await page
          .waitForFunction((title) => document.title === title, expected, {
            timeout: 10000,
          })
          .catch(() => {});
        assert.equal(
          await page.title(),
          expected,
          `the ${framework} reading names its framework`,
        );
      }
    } finally {
      await browser.close();
    }
  });

  test(`${name}: a page without tabs answers at its reading`, async () => {
    const browser = await browserType.launch();
    try {
      const page = await (await browser.newContext()).newPage();
      for (const [slug, framework] of [
        ['getting-started', 'svelte'],
        ['recipes/dialog', 'html'],
      ]) {
        const url = motionUrl(slug, framework);
        const response = await page.goto(base + url);
        assert.equal(response.status(), 200, `${url} answers 200`);
        assert.equal(
          await page.locator('h1').first().textContent(),
          needOf(slug).label,
          `${url} has its H1`,
        );
      }
    } finally {
      await browser.close();
    }
  });

  test(`${name}: the stub goes to the stored framework, keeping query and hash`, async () => {
    const browser = await browserType.launch();
    try {
      const context = await browser.newContext();
      await storeFramework(context, 'svelte');
      const page = await context.newPage();
      await page.goto(base + '/motion/presence?x=1#options');
      await page.waitForURL(
        (url) => url.pathname.replace(/\/$/, '') === '/svelte/motion/presence/guide',
      );
      const landed = new URL(page.url());
      assert.equal(landed.search, '?x=1', 'the query is kept');
      assert.equal(landed.hash, '#options', 'the hash is kept');

      await page.goto(base + '/motion/presence/examples');
      await page.waitForURL(
        (url) => url.pathname.replace(/\/$/, '') === '/svelte/motion/presence/examples',
      );
    } finally {
      await browser.close();
    }
  });

  test(`${name}: the stub without a stored choice goes to React`, async () => {
    const browser = await browserType.launch();
    try {
      const page = await (await browser.newContext()).newPage();
      await page.goto(base + '/motion/recipes/dialog');
      await page.waitForURL(
        (url) => url.pathname.replace(/\/$/, '') === '/react/motion/recipes/dialog',
      );
    } finally {
      await browser.close();
    }
  });

  test(`${name}: the stub goes to React for anything else than the four frameworks`, async () => {
    const browser = await browserType.launch();
    try {
      for (const stored of ['vue', '']) {
        const context = await browser.newContext();
        await storeFramework(context, stored);
        const page = await context.newPage();
        await page.goto(base + '/motion/presence');
        await page.waitForURL(
          (url) => url.pathname.replace(/\/$/, '') === '/react/motion/presence/guide',
        );
        assert.doesNotMatch(
          page.url(),
          /undefined|null/,
          `storage "${stored}" never leaks into the address`,
        );
      }

      const context = await browser.newContext();
      await context.addInitScript(() => {
        Storage.prototype.getItem = () => {
          throw new Error('storage denied');
        };
      });
      const page = await context.newPage();
      await page.goto(base + '/motion/presence');
      await page.waitForURL(
        (url) => url.pathname.replace(/\/$/, '') === '/react/motion/presence/guide',
      );
      assert.doesNotMatch(
        page.url(),
        /undefined|null/,
        'a storage that throws never leaks into the address',
      );
    } finally {
      await browser.close();
    }
  });

  test(`${name}: a feature's tab header marks its tab and opens the other`, async () => {
    const browser = await browserType.launch();
    try {
      const page = await (await browser.newContext()).newPage();
      await page.goto(base + motionUrl('presence', 'react', 'guide'));
      const tabs = page.locator('[data-page-tabs] [role="tab"]');
      assert.equal(
        await tabs.count(),
        2,
        'Presence has a Guide and an Examples tab',
      );
      assert.equal((await tabs.nth(0).textContent()).trim(), 'Guide');
      assert.equal(
        await tabs.nth(0).getAttribute('aria-selected'),
        'true',
        'the Guide is selected',
      );
      assert.equal((await tabs.nth(1).textContent()).trim(), 'Examples');
      assert.equal(
        await tabs.nth(1).getAttribute('href'),
        '/react/motion/presence/examples',
      );
      assert.equal(await tabs.nth(1).getAttribute('aria-selected'), 'false');

      await page.goto(base + motionUrl('emphasis', 'react', 'guide'));
      assert.equal(
        await page.locator('[data-page-tabs]').count(),
        0,
        'a feature with one tab has no tab header',
      );
    } finally {
      await browser.close();
    }
  });

  test(`${name}: the Examples tab lists the recipes of the feature`, async () => {
    const browser = await browserType.launch();
    try {
      const page = await (await browser.newContext()).newPage();
      for (const feature of ['presence', 'layout']) {
        await page.goto(base + motionUrl(feature, 'angular', 'examples'));
        const listed = await page
          .locator('li > a[href^="/angular/motion/recipes/"]')
          .evaluateAll((links) =>
            links.map((link) => ({
              href: link.getAttribute('href'),
              label: link.querySelector('span')?.textContent.trim(),
            })),
          );
        const expected = MOTION_NEEDS.filter(
          (need) => need.features?.includes(feature) === true,
        ).map((need) => ({
          href: motionUrl(need.slug, 'angular'),
          label: need.label,
        }));
        assert.deepEqual(listed, expected, `the recipes of ${feature}`);
      }
    } finally {
      await browser.close();
    }
  });

  test(`${name}: the rail opens Animation on a prefixed URL and marks the page`, async () => {
    const browser = await browserType.launch();
    try {
      const page = await (await browser.newContext()).newPage();
      await page.goto(base + motionUrl('presence', 'svelte', 'guide'));
      await page.waitForSelector('a.navigation-rail-item[href="/motion"][aria-current="page"]');
      assert.equal(
        await page
          .getByRole('navigation', { name: 'Animation documentation' })
          .getByRole('link', { name: needOf('presence').label, exact: true })
          .getAttribute('aria-current'),
        'page',
        'the side panel marks Presence',
      );
    } finally {
      await browser.close();
    }
  });

  test(`${name}: the side panel marks a feature on each of its tabs`, async () => {
    const browser = await browserType.launch();
    try {
      const page = await (await browser.newContext()).newPage();
      const presence = page
        .getByRole('navigation', { name: 'Animation documentation' })
        .getByRole('link', { name: needOf('presence').label, exact: true });
      for (const tab of ['guide', 'examples']) {
        await page.goto(base + motionUrl('presence', 'react', tab));
        assert.equal(
          await presence.getAttribute('aria-current'),
          'page',
          `Presence is marked on its ${tab} tab`,
        );
      }
    } finally {
      await browser.close();
    }
  });

  test(`${name}: rail and side panel links keep the reading's prefix`, async () => {
    const browser = await browserType.launch();
    try {
      const page = await (await browser.newContext()).newPage();
      await page.goto(base + motionUrl('layout', 'angular', 'guide'));
      assertFrameworkLinks(
        await hrefsOf(
          page
            .getByRole('navigation', { name: 'Animation documentation' })
            .locator('a[href]'),
        ),
        'angular',
      );
      // The rail's sections are neutral pages: none of them takes a framework.
      assertFrameworkLinks(
        await hrefsOf(page.locator('a.navigation-rail-item[href]')),
        'angular',
      );
    } finally {
      await browser.close();
    }
  });

  test(`${name}: a neutral page rewrites its static framework links to the stored choice before the first paint`, async () => {
    const browser = await browserType.launch();
    try {
      const context = await browser.newContext();
      await storeFramework(context, 'svelte');
      // Only the head script may act: the page's bundles are blocked.
      await context.route(/\/_astro\/[^?]*\.js/, (route) => route.abort());
      const page = await context.newPage();
      await page.goto(base + '/motion', { waitUntil: 'domcontentloaded' });
      const hrefs = await hrefsOf(page.locator('a[data-framework-link]'));
      assert.ok(hrefs.length > 0, 'the home links to framework pages');
      for (const href of hrefs) {
        assert.match(href, /^\/svelte\//, `${href} names the stored framework`);
      }
    } finally {
      await browser.close();
    }
  });

  test(`${name}: on /motion/glossary with Svelte stored, no console error or warning, and after hydration the side panel's framework links start with /svelte/`, async () => {
    const browser = await browserType.launch();
    try {
      const context = await browser.newContext();
      await storeFramework(context, 'svelte');
      const page = await context.newPage();
      const logged = [];
      page.on('console', (message) => {
        if (message.type() === 'error' || message.type() === 'warning')
          logged.push(message.text());
      });
      await page.goto(base + '/motion/glossary');
      await page.waitForSelector(
        'nav[aria-label="Animation documentation"] a[href^="/svelte/"]',
      );
      assertFrameworkLinks(
        await hrefsOf(
          page
            .getByRole('navigation', { name: 'Animation documentation' })
            .locator('a[href]'),
        ),
        'svelte',
      );
      assert.deepEqual(logged, [], 'the page logs no error or warning');
    } finally {
      await browser.close();
    }
  });

  test(`${name}: on /angular/motion/presence/guide with Svelte stored they start with /angular/`, async () => {
    const browser = await browserType.launch();
    try {
      const context = await browser.newContext();
      await storeFramework(context, 'svelte');
      const page = await context.newPage();
      await page.goto(base + motionUrl('presence', 'angular', 'guide'));
      await page.waitForLoadState('networkidle');
      assertFrameworkLinks(
        await hrefsOf(
          page
            .getByRole('navigation', { name: 'Animation documentation' })
            .locator('a[href]'),
        ),
        'angular',
      );
    } finally {
      await browser.close();
    }
  });

  test(`${name}: opening a reading does not change the stored choice`, async () => {
    const browser = await browserType.launch();
    try {
      const context = await browser.newContext();
      await storeFramework(context, 'svelte');
      const page = await context.newPage();
      await page.goto(base + motionUrl('presence', 'react', 'guide'));
      await page
        .getByRole('navigation', { name: 'Animation documentation' })
        .getByRole('link', { name: needOf('layout').label, exact: true })
        .click();
      await page.waitForURL(
        (url) =>
          url.pathname.replace(/\/$/, '') === motionUrl('layout', 'react', 'guide'),
      );
      assert.equal(
        await page.evaluate(
          (key) => window.localStorage.getItem(key),
          STORAGE_KEY,
        ),
        'svelte',
        'the stored choice is kept',
      );
    } finally {
      await browser.close();
    }
  });

  test(`${name}: with Svelte stored, search finds /components/button/overview and /theme/colors, and only the Svelte reading of a framework page`, async (t) => {
    const indexed = await fetch(base + '/pagefind/pagefind.js').then(
      (response) => response.ok,
      () => false,
    );
    if (!indexed)
      return t.skip('the search index is built with the site (npx astro build)');
    const browser = await browserType.launch();
    try {
      const context = await browser.newContext();
      await storeFramework(context, 'svelte');
      const page = await context.newPage();
      await page.goto(base + motionUrl('presence', 'react', 'guide'));
      await page
        .locator('.navigation-rail')
        .getByRole('button', { name: 'Search', exact: true })
        .click();
      const input = page.locator('input[aria-label="Search documentation"]');
      /** Searches `query`, and waits until the results list `expected`; returns the results' addresses. */
      const search = async (query, expected) => {
        await input.fill(query);
        await page.waitForFunction(
          (href) =>
            [...document.querySelectorAll('a[role="option"]')].some(
              (link) => link.getAttribute('href')?.replace(/\/$/, '') === href,
            ),
          expected,
          { timeout: 15000 },
        );
        return (await hrefsOf(page.locator('a[role="option"]'))).map((href) =>
          href.replace(/\/$/, ''),
        );
      };
      assert.ok(
        (await search('button', '/components/button/overview')).includes(
          '/components/button/overview',
        ),
        'the button page is found',
      );
      assert.ok(
        (await search('colors', '/theme/colors')).includes('/theme/colors'),
        'the colors page is found',
      );
      const readings = await search('presence', '/svelte/motion/presence/guide');
      for (const href of readings) {
        const { framework } = splitFramework(href);
        assert.ok(
          framework === undefined || framework === 'svelte',
          `${href} is not a reading of the stored framework`,
        );
      }
    } finally {
      await browser.close();
    }
  });
}
