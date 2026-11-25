// Run against a built site: MOTION_BROWSERS=chromium,firefox,webkit MOTION_DOC_URL=http://localhost:4322 node --test tests/pages.browser.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium, firefox, webkit } from 'playwright';
import ts from 'typescript';

const base = process.env.MOTION_DOC_URL ?? 'http://localhost:4322';
const browserTypes = { chromium, firefox, webkit };
const browsers = (process.env.MOTION_BROWSERS ?? 'chromium').split(',').map(name => name.trim());

/** The motion documentation: every page loads, with no page error, and the families' live examples hydrate. */
const motionPages = [
  '/motion',
  '/motion/getting-started',
  '/motion/how-it-works',
  '/motion/choosing-an-api',
  '/motion/presets',
  '/motion/presence',
  '/motion/lists',
  '/motion/emphasis',
  '/motion/layout',
  '/motion/shared-elements',
  '/motion/gestures',
  '/motion/page-transitions',
  '/motion/reveal',
  '/motion/scrub',
  '/motion/scroll',
  '/motion/values',
  '/motion/sequences',
  '/motion/text',
  '/motion/svg',
  '/motion/loop',
  '/motion/tokens',
  '/motion/per-breakpoint',
  '/motion/inspect',
  '/motion/animate',
  '/motion/accessibility',
  '/motion/loading-and-weight',
  '/motion/limits',
  '/motion/roadmap',
  '/motion/api',
  '/motion/glossary',
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

/**
 * The exports of the main entry of @udixio/motion, read from its source with the TypeScript compiler, independently of the
 * generated data of the API page: each must have its anchor on /motion/api.
 */
function motionMainExports() {
  const index = new URL('../../../packages/motion/src/index.ts', import.meta.url).pathname;
  const program = ts.createProgram({
    rootNames: [index],
    options: { noEmit: true, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, skipLibCheck: true },
  });
  const checker = program.getTypeChecker();
  const moduleSymbol = checker.getSymbolAtLocation(program.getSourceFile(index));
  return checker.getExportsOfModule(moduleSymbol).map(symbol => symbol.name).sort();
}

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
 * Lets every visible island hydrate: the page is scrolled once so that the islands loaded on visibility are reached, then
 * the wait is for the islands that are laid out to lose their `ssr` marker, which Astro removes when an island has hydrated.
 * An island inside a hidden framework tab is not laid out, so it is not waited for: it hydrates when its tab is chosen.
 */
async function settle(page) {
  await page.evaluate(async () => {
    // About sixty steps whatever the height: WebKit allows 100 history.replaceState calls per 10 s, and Astro's router
    // makes one at the end of each scroll, so 500 px steps down the 180,000 px API reference would trip it.
    const step = Math.max(500, Math.ceil(document.body.scrollHeight / 60));
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise(resolve => setTimeout(resolve, 40));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForFunction(
    () => [...document.querySelectorAll('astro-island[ssr]')].filter(island => island.getClientRects().length > 0).length === 0,
    null,
    { timeout: 30000 },
  );
  await page.waitForTimeout(300);
}

/**
 * The redirects of the built site, read from the Vercel routes (`.vercel/output/config.json`): the static server used by the
 * browser tests does not follow them, so the route itself is the test. Each old URL must match a route that sends it to the
 * new page with a 301.
 */
async function vercelRedirects() {
  const config = JSON.parse(await readFile(new URL('../.vercel/output/config.json', import.meta.url), 'utf8'));
  return config.routes.filter(route => route.status === 301 && route.headers?.Location);
}

function redirectFor(routes, path) {
  return routes.find(route => new RegExp(route.src).test(path));
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
      // The chat input is a Udixio outlined TextField: its focus indicator is the field's outline, 3 px of primary.
      const input = page.getByRole('textbox', { name: 'Message', exact: true });
      await input.focus();
      // The outline's width and colour transition on the fast effects spring: read them once it has settled.
      await page.waitForTimeout(500);
      const outline = await input.evaluate(element => {
        const field = getComputedStyle(element.closest('fieldset'));
        const primary = document.createElement('span');
        primary.className = 'text-primary';
        document.body.append(primary);
        const color = getComputedStyle(primary).color;
        primary.remove();
        return { width: Number.parseFloat(field.borderTopWidth), color: field.borderTopColor, primary: color };
      });
      assert.ok(outline.width >= 2, `The chat input outline is ${outline.width} px wide when focused, expected at least 2 px`);
      assert.equal(outline.color, outline.primary, 'The chat input outline is not primary when focused');
      const tab = page.getByRole('tab', { name: 'Colors', exact: true });
      await tab.focus();
      await expectVisibleFocus(tab, 'The Colors tab');
    } finally { await browser.close(); }
  });

  test(`${name}: an html preference falls back to React on a component page, and the preference is kept`, async () => {
    const browser = await browserType.launch();
    try {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      await context.addInitScript(() => window.localStorage.setItem('udixio:docs:preferred-example-framework', 'html'));
      const page = await context.newPage();
      await page.goto(base + '/components/switch/overview/', { waitUntil: 'load' });
      await settle(page);
      // A component page has no html example: each of its examples offers React, Angular and Svelte, with React selected.
      const selectors = await page.locator('[aria-label="Example framework"]').evaluateAll(groups => groups.map(group => ({
        tabs: [...group.querySelectorAll('[role="tab"]')].map(tab => tab.textContent.trim()),
        selected: [...group.querySelectorAll('[role="tab"][aria-selected="true"]')].map(tab => tab.textContent.trim()),
      })));
      assert.ok(selectors.length > 0, 'the page has no example');
      for (const selector of selectors) {
        assert.deepEqual(selector.tabs, ['React', 'Angular', 'Svelte']);
        assert.deepEqual(selector.selected, ['React']);
      }
      assert.equal(await page.evaluate(() => window.localStorage.getItem('udixio:docs:preferred-example-framework')), 'html');
    } finally { await browser.close(); }
  });

  test(`${name}: every motion page loads without a page error`, async () => {
    const browser = await browserType.launch();
    try {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const failures = [];
      // One tab per page: WebKit allows a tab 100 history.replaceState calls per 10 s, and Astro's router makes one on
      // each load, so thirty loads in one tab would trip the limit, which no visitor does.
      for (const path of motionPages) {
        const page = await context.newPage();
        const errors = await recordErrors(page);
        const response = await page.goto(base + path, { waitUntil: 'load' });
        assert.equal(response.status(), 200, path);
        await settle(page);
        const found = await errors();
        if (found.length > 0) failures.push(`${path}: ${[...new Set(found)].join(' | ').slice(0, 400)}`);
        await page.close();
      }
      assert.deepEqual(failures, []);
    } finally { await browser.close(); }
  });

  test(`${name}: the API reference renders an anchor per export of the main entry, without a page error`, async () => {
    const exports = motionMainExports();
    assert.ok(exports.length > 50, `the main entry exports only ${exports.length} names`);
    const browser = await browserType.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      const errors = await recordErrors(page);
      const response = await page.goto(base + '/motion/api', { waitUntil: 'load' });
      assert.equal(response.status(), 200);
      assert.equal(await page.locator('h1').first().textContent(), 'API');
      const ids = new Set(await page.evaluate(() => [...document.querySelectorAll('[id]')].map(element => element.id)));
      const missing = exports.filter(name => !ids.has(`api-${name}`));
      assert.deepEqual(missing, [], 'exports of @udixio/motion with no anchor on /motion/api');
      // Review 6, M4: every entry is folded until opened, and the page is no longer a wall.
      const shape = await page.evaluate(() => ({
        entries: document.querySelectorAll('details[data-api-entry]').length,
        open: document.querySelectorAll('details[data-api-entry][open]').length,
        height: document.documentElement.scrollHeight,
      }));
      assert.ok(shape.entries > 250, `only ${shape.entries} entries`);
      assert.equal(shape.open, 0, 'an entry is open on load');
      assert.ok(shape.height < 60000, `the page is ${shape.height} px tall`);
      // Two tiers: the essentials first, then the advanced exports.
      assert.deepEqual(await page.locator('#api-entries h2').allTextContents(), ['Essentials', 'Advanced']);
      assert.equal(await page.locator('#essentials ~ div #api-defineMotion').count(), 1, 'defineMotion is not an essential');
      assert.equal(await page.locator('#advanced ~ div #api-listedTarget').count(), 1, 'listedTarget is not advanced');
      // A link of the index opens its entry and lands on it.
      await page.locator('nav[aria-label="API index"] a[href="#api-motion"]').click();
      await page.waitForFunction(() => location.hash === '#api-motion');
      assert.equal(await page.locator('#api-motion').evaluate(element => element.open), true, 'its link did not open #api-motion');
      const top = await page.locator('#api-motion').evaluate(element => element.getBoundingClientRect().top);
      assert.ok(top >= -1 && top < 300, `#api-motion is at ${top} px after its link`);
      // The filter keeps the entries whose name or summary holds the words, says how many, and has an empty state.
      const filter = page.getByLabel('Filter the reference');
      await filter.fill('stagger');
      await page.waitForFunction(() => document.querySelector('[role="status"]')?.textContent?.includes(' of '));
      const shown = await page.evaluate(() => [...document.querySelectorAll('details[data-api-entry]:not([hidden])')].map(entry => entry.id));
      assert.ok(shown.includes('api-staggerDelay') && !shown.includes('api-defineMotion'), `the filter shows ${shown.join(', ')}`);
      assert.match(await page.locator('[role="status"]').textContent(), new RegExp(`^${shown.length} of ${shape.entries} entries$`));
      await filter.fill('zzzq');
      await page.getByText('Nothing matches “zzzq”').waitFor();
      // An anchor to an entry the filter hides clears the filter and opens the entry.
      await page.evaluate(() => { location.hash = '#api-orderMotions'; });
      await page.waitForFunction(() => document.getElementById('api-orderMotions')?.open === true);
      // The filter clears on the render after the entry opens.
      await page.waitForFunction(() => document.querySelector('input[aria-label="Filter the reference"], [aria-label="Filter the reference"] input')?.value === '' || [...document.querySelectorAll('input')].some(input => input.labels?.[0]?.textContent?.includes('Filter the reference') && input.value === ''), null, { timeout: 5000 });
      assert.equal(await filter.inputValue(), '');
      const hidden = await page.evaluate(() => document.querySelectorAll('details[data-api-entry][hidden]').length);
      assert.equal(hidden, 0, 'the filter was not cleared');
      // Once the filter's render has settled (Safari has no scroll anchoring: the page scrolls to the entry again).
      await page.waitForFunction(() => { const top = document.getElementById('api-orderMotions').getBoundingClientRect().top; return top >= -1 && top < 300; }, null, { timeout: 3000 }).catch(() => {});
      const anchored = await page.locator('#api-orderMotions').evaluate(element => element.getBoundingClientRect().top);
      assert.ok(anchored >= -1 && anchored < 300, `#api-orderMotions is at ${anchored} px after its anchor`);
      const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      assert.ok(documentWidth <= 1280, `the document is ${documentWidth} px wide`);
      assert.deepEqual(await errors(), []);
    } finally { await browser.close(); }
  });

  test(`${name}: the API reference at 375 px wraps its signatures and puts the chosen framework first`, async () => {
    const browser = await browserType.launch();
    try {
      const context = await browser.newContext({ viewport: { width: 375, height: 800 } });
      await context.addInitScript(() => localStorage.setItem('udixio:docs:preferred-example-framework', 'svelte'));
      const page = await context.newPage();
      const errors = await recordErrors(page);
      await page.goto(base + '/motion/api#api-staggerDelay', { waitUntil: 'load' });
      await page.waitForFunction(() => document.getElementById('api-staggerDelay')?.open === true);
      // "Written for" Svelte: its blocks come first, then the core, in each tier and in the index.
      const orders = await page.evaluate(() => [...document.querySelectorAll('[data-api-order]')].map(container => container.firstElementChild?.dataset.apiFramework));
      assert.deepEqual(orders, ['svelte', 'svelte', 'svelte', 'svelte']);
      await page.getByRole('button', { name: 'Open all' }).click();
      const overflow = await page.evaluate(() => ({
        page: document.documentElement.scrollWidth,
        pre: [...document.querySelectorAll('#api-entries pre')].filter(pre => pre.scrollWidth > pre.clientWidth + 1).length,
      }));
      assert.ok(overflow.page <= 375, `the document is ${overflow.page} px wide`);
      assert.equal(overflow.pre, 0, 'a signature or an example scrolls sideways');
      assert.deepEqual(await errors(), []);
    } finally { await browser.close(); }
  });

  test(`${name}: a selected framework tab hydrates its preview island`, async () => {
    const browser = await browserType.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      const errors = await recordErrors(page);
      await page.goto(base + '/motion/presence/', { waitUntil: 'load' });
      await settle(page);
      // The Angular preview is in a hidden tab: its island is not laid out, so it has not hydrated and has no button yet.
      const angular = page.locator('[data-example-panel][data-framework="angular"][data-view="preview"] astro-island');
      assert.equal(await angular.getAttribute('ssr'), '', 'the Angular preview hydrated before its tab was chosen');
      await page.locator('[aria-label="Example framework"]').first().getByRole('tab', { name: 'Angular', exact: true }).click();
      // The preview beside its code is as tall as the code, its example at the top: bring the top into view.
      await page.locator('[data-example-panel][data-framework="angular"][data-view="preview"]').evaluate(element => element.scrollIntoView({ block: 'start' }));
      await page.waitForFunction(() => {
        const island = document.querySelector('[data-example-panel][data-framework="angular"][data-view="preview"] astro-island');
        return island !== null && !island.hasAttribute('ssr');
      }, null, { timeout: 30000 });
      await page.locator('[data-example-panel][data-framework="angular"][data-view="preview"]').getByRole('button', { name: 'Save to library', exact: true }).waitFor();
      assert.deepEqual(await errors(), []);
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

// The redirects are not browser behaviour: the built routes are read once, whatever the engines.
test('the old motion URLs redirect with a 301 to their new pages in the built routes', async () => {
  const routes = await vercelRedirects();
  const reveal = redirectFor(routes, '/motion/reveal-scrub-loop');
  assert.equal(reveal?.status, 301);
  assert.equal(reveal.headers.Location, '/motion/reveal');
  const demo = redirectFor(routes, '/motion/demo');
  assert.equal(demo?.status, 301);
  assert.equal(demo.headers.Location, '/motion');
  const counters = redirectFor(routes, '/motion/counters');
  assert.equal(counters?.status, 301);
  assert.equal(counters.headers.Location, '/motion/values#counters');
  const scopes = redirectFor(routes, '/motion/scopes');
  assert.equal(scopes?.status, 301);
  assert.equal(scopes.headers.Location, '/motion/per-breakpoint');
});
