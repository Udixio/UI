// Run against a built site: MOTION_BROWSERS=chromium,firefox,webkit MOTION_DOC_URL=http://localhost:4322 node --test tests/recipes.browser.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium, firefox, webkit } from 'playwright';

const base = process.env.MOTION_DOC_URL ?? 'http://localhost:4322';
const browserTypes = { chromium, firefox, webkit };
const browsers = (process.env.MOTION_BROWSERS ?? 'chromium').split(',').map(name => name.trim());

/** Messages of a hydration mismatch, in the development build and the production one (minified error #418). */
const HYDRATION = /hydrat|did not match|didn't match|Minified React error #418|#418/;

/** The frameworks whose recipes have a live preview. */
const FRAMEWORKS = ['react', 'angular', 'svelte'];

/** Records the uncaught errors of the page, and the hydration errors React logs. */
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
  return async () => {
    found.push(...(await page.evaluate(() => window.__udxErrors ?? [])));
    return found.splice(0, found.length);
  };
}

/** Scrolls the page once, so the islands loaded on visibility hydrate, then waits for the laid-out islands to hydrate. */
async function settle(page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) {
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

/** The live preview of a recipe, in a framework: the first example block of the recipe's page (/motion/recipes/<recipe>). */
function preview(page, framework) {
  return page
    .locator('.motion-usage')
    .first()
    .locator(`[data-example-panel][data-framework="${framework}"][data-view="preview"]`);
}

/** The text of the focused element, or its accessible name. */
const focusedText = page => page.evaluate(() => document.activeElement?.textContent?.trim() ?? '');

/** One interaction per recipe, run inside its preview; the key is the slug of its page under /motion/recipes/. */
const RECIPES = {
  async dialog(page, panel) {
    await panel.getByRole('button', { name: 'Delete draft' }).click();
    const dialog = panel.getByRole('dialog', { name: 'Delete this draft?' });
    await dialog.waitFor();
    // Focus moves to the safe choice.
    await page.waitForFunction(() => document.activeElement?.textContent?.trim() === 'Cancel');
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'detached' });
    // The exit gave focus back to the opener.
    assert.equal(await focusedText(page), 'Delete draft');
  },
  async toasts(page, panel) {
    await panel.getByRole('button', { name: 'Notify' }).click();
    const toasts = panel.locator('ol[aria-label="Notifications"] > li');
    await toasts.first().waitFor();
    assert.equal(await toasts.count(), 1);
    await panel.getByRole('button', { name: 'Dismiss' }).click();
    await page.waitForFunction(
      element => element.querySelectorAll('ol[aria-label="Notifications"] > li').length === 0,
      await panel.elementHandle(),
      { timeout: 5000 },
    );
  },
  async accordion(page, panel) {
    const question = panel.getByRole('button', { name: 'How long does delivery take?' });
    const answer = panel.getByText('Two to four working days.');
    assert.equal(await answer.isVisible(), false, 'the answer starts closed');
    await question.click();
    await answer.waitFor({ state: 'visible' });
    assert.equal(await question.getAttribute('aria-expanded'), 'true');
    await question.click();
    // The exit plays, then hidden takes over.
    await answer.waitFor({ state: 'hidden', timeout: 5000 });
  },
  async 'tab-indicator'(page, panel) {
    const specs = panel.getByRole('tab', { name: 'Specs' });
    await specs.click();
    await page.waitForFunction(element => element.getAttribute('aria-selected') === 'true', await specs.elementHandle());
    await panel.getByText('Recycled nylon').waitFor({ state: 'visible' });
  },
  async 'navigation-menu'(page, panel) {
    // The closed submenu's links are in the DOM already.
    assert.ok((await panel.locator('a[href="/motion/lists"]').count()) > 0, 'the closed submenu keeps its links');
    const trigger = panel.getByRole('menuitem', { name: 'Appear and leave' });
    await trigger.click();
    await page.waitForFunction(element => element.getAttribute('aria-expanded') === 'true', await trigger.elementHandle());
    await panel.getByRole('menuitem', { name: 'Make a list appear' }).waitFor({ state: 'visible' });
  },
};

for (const name of browsers) {
  if (!Object.hasOwn(browserTypes, name)) throw new Error(`Unknown MOTION_BROWSERS entry: ${name}`);
  const browserType = browserTypes[name];

  test(`${name}: the recipes and troubleshooting pages load without a page error`, async () => {
    const browser = await browserType.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      const errors = await recordErrors(page);
      const failures = [];
      for (const path of ['/motion/recipes', ...Object.keys(RECIPES).map(recipe => `/motion/recipes/${recipe}`), '/motion/troubleshooting']) {
        const response = await page.goto(base + path, { waitUntil: 'load' });
        assert.equal(response.status(), 200, path);
        await settle(page);
        const found = await errors();
        if (found.length > 0) failures.push(`${path}: ${[...new Set(found)].join(' | ').slice(0, 400)}`);
      }
      assert.deepEqual(failures, []);
    } finally { await browser.close(); }
  });

  test(`${name}: a closed accordion answer and a closed submenu's links are in the server HTML`, async () => {
    const browser = await browserType.launch();
    try {
      const context = await browser.newContext({ javaScriptEnabled: false });
      const page = await context.newPage();
      await page.goto(base + '/motion/recipes/accordion', { waitUntil: 'load' });
      for (const framework of FRAMEWORKS) {
        const accordion = preview(page, framework);
        assert.match(await accordion.locator('[role="region"][hidden]').first().textContent(), /within 30 days/, framework);
      }
      // The submenu's links, closed, in the server HTML of the React and Svelte previews.
      await page.goto(base + '/motion/recipes/navigation-menu', { waitUntil: 'load' });
      for (const framework of ['react', 'svelte']) {
        assert.ok((await preview(page, framework).locator('a[href="/motion/lists"]').count()) > 0, framework);
      }
    } finally { await browser.close(); }
  });

  for (const framework of FRAMEWORKS) {
    test(`${name}: each recipe runs in its ${framework} tab`, async () => {
      const browser = await browserType.launch();
      try {
        const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
        await context.addInitScript(value => window.localStorage.setItem('udixio:docs:preferred-example-framework', value), framework);
        const page = await context.newPage();
        const errors = await recordErrors(page);
        for (const [recipe, run] of Object.entries(RECIPES)) {
          await page.goto(base + `/motion/recipes/${recipe}`, { waitUntil: 'load' });
          await settle(page);
          const panel = preview(page, framework);
          await panel.scrollIntoViewIfNeeded();
          await page.waitForFunction(element => !element.querySelector('astro-island[ssr]'), await panel.elementHandle(), { timeout: 30000 });
          await run(page, panel);
        }
        assert.deepEqual(await errors(), []);
      } finally { await browser.close(); }
    });
  }
}
