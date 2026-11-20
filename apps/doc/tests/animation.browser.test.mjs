// Run against a built site: MOTION_BROWSERS=chromium,firefox,webkit MOTION_DOC_URL=http://localhost:4322 node --test tests/animation.browser.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium, firefox, webkit } from 'playwright';
import { MOTION_NEEDS } from '../src/lib/motion-nav.ts';

const base = process.env.MOTION_DOC_URL ?? 'http://localhost:4322';
const browserTypes = { chromium, firefox, webkit };
const browsers = (process.env.MOTION_BROWSERS ?? 'chromium').split(',').map(name => name.trim());

/** Two frames: the code after them has seen the page painted once. */
const frames = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));

/**
 * A scene mounts when its stage nears the view, and the layout engine loads with the first scene that needs it: bring the
 * element to the view, wait until the scene is mounted (`ready`), then until the page is quiet and two frames have passed.
 */
async function bringScene(page, stage, ready) {
  await page.locator(stage).first().scrollIntoViewIfNeeded();
  await page.waitForSelector(ready);
  await page.waitForLoadState('networkidle');
  await frames(page);
}

for (const name of browsers) {
  if (!Object.hasOwn(browserTypes, name)) throw new Error(`Unknown MOTION_BROWSERS entry: ${name}`);
  const browserType = browserTypes[name];

  test(`${name}: the root page is a showcase: a hero, the principle, a card per need in the side panel's order, and the facts`, async () => {
    const browser = await browserType.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      await page.goto(base + '/motion/', { waitUntil: 'load' });
      await page.getByRole('heading', { level: 1, name: 'Define a motion once, attach it by name.' }).waitFor();
      const sections = await page.locator('.motion-page h2').allTextContents();
      assert.deepEqual(sections.map(text => text.trim()), ['One motion, every framework', 'What it does', 'Browsers and weight']);
      const needs = MOTION_NEEDS.filter(need => need.scene);
      assert.equal(needs.length, 20);
      // One vocabulary: each card is a link named by its need, to its page, with one API name; no code, no control.
      const cards = await page.locator('[data-need-card]').evaluateAll(links => links.map(link => ({
        slug: link.dataset.needCard,
        href: link.getAttribute('href'),
        name: link.querySelector('.card-name').textContent.trim(),
        api: link.querySelector('.card-api')?.textContent.trim(),
        controls: link.querySelectorAll('button, input, select, pre').length,
      })));
      assert.deepEqual(cards, needs.map(need => ({ slug: need.slug, href: need.href, name: need.label, api: need.hints[0], controls: 0 })));
      for (const need of needs.slice(0, 3)) {
        assert.equal(await page.getByRole('link', { name: need.label, exact: true }).first().getAttribute('href'), need.href);
      }
      // One code block (the principle), one Reduce motion switch, and no section bar.
      assert.equal(await page.locator('[data-code-tabs]').count(), 1);
      assert.equal(await page.getByRole('switch').count(), 1);
      assert.equal(await page.locator('[data-section-link]').count(), 0);
    } finally { await browser.close(); }
  });

  test(`${name}: the root page is calm: nothing runs one second after load, no task blocks it, and the previews load with the gallery`, async () => {
    const browser = await browserType.launch();
    try {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'no-preference' });
      // Long tasks are recorded from the first script on, where the browser exposes them.
      await context.addInitScript(() => {
        window.__longTasks = [];
        if (PerformanceObserver.supportedEntryTypes?.includes('longtask')) {
          new PerformanceObserver(list => {
            for (const entry of list.getEntries()) window.__longTasks.push(entry.duration);
          }).observe({ type: 'longtask', buffered: true });
        }
      });
      const page = await context.newPage();
      await page.goto(base + '/motion/', { waitUntil: 'load' });
      await page.waitForTimeout(1000);
      const running = await page.evaluate(() => document.getAnimations()
        .filter(animation => animation.playState === 'running' && animation.timeline === document.timeline)
        .map(animation => animation.effect?.target?.className ?? String(animation.effect?.target?.tagName)));
      assert.deepEqual(running, [], 'a time-based animation runs at the top of the page');
      if (name === 'chromium') {
        const longTasks = await page.evaluate(() => window.__longTasks);
        assert.deepEqual(longTasks.filter(duration => duration > 50), [], 'a task over 50 ms blocked the page during load');
      }
      const previewsLoaded = () => page.evaluate(() => performance.getEntriesByType('resource').some(entry => /\/previews[.-][^/]*\.js/.test(entry.name)));
      assert.equal(await previewsLoaded(), false, 'the previews module loads with the shell');
      await page.locator('[data-gallery]').scrollIntoViewIfNeeded();
      await page.waitForFunction(() => performance.getEntriesByType('resource').some(entry => /\/previews[.-][^/]*\.js/.test(entry.name)));
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
      const playing = await page.evaluate(() => [...document.querySelectorAll('[data-preview]')].flatMap(el => el.getAnimations({ subtree: true })).length);
      assert.equal(playing, 0, 'a preview plays without being hovered');
    } finally { await browser.close(); }
  });

  test(`${name}: a card's preview plays when the card is hovered or focused, and comes back to rest; under reduced motion it stays still`, async () => {
    const browser = await browserType.launch();
    try {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'no-preference' });
      const page = await context.newPage();
      await page.goto(base + '/motion/', { waitUntil: 'load' });
      await page.locator('[data-gallery]').scrollIntoViewIfNeeded();
      await page.waitForFunction(() => performance.getEntriesByType('resource').some(entry => /\/previews[.-][^/]*\.js/.test(entry.name)));
      await page.waitForLoadState('networkidle');
      const moving = slug => page.evaluate(slug => document.querySelector(`[data-preview="${slug}"]`).getAnimations({ subtree: true }).length, slug);
      const rested = slug => page.waitForFunction(slug => {
        const preview = document.querySelector(`[data-preview="${slug}"]`);
        return preview.getAnimations({ subtree: true }).length === 0 && [...preview.querySelectorAll('[data-p]')].every(el => !el.getAttribute('style'));
      }, slug, { timeout: 8000 });
      await page.locator('[data-need-card="lists"]').hover();
      await page.waitForFunction(() => document.querySelector('[data-preview="lists"]').getAnimations({ subtree: true }).length > 0);
      await page.mouse.move(2, 2);
      await rested('lists');
      // The keyboard plays it too.
      await page.locator('[data-need-card="layout"]').focus();
      await page.keyboard.press('Shift+Tab');
      await page.keyboard.press('Tab');
      await page.waitForFunction(() => document.querySelector('[data-preview="layout"]').getAnimations({ subtree: true }).length > 0);
      await rested('layout');
      // The page's Reduce motion switch holds them.
      await page.getByRole('switch', { name: 'Reduce motion' }).click();
      await page.waitForFunction(() => document.documentElement.dataset.motionPolicy === 'reduce');
      await page.locator('[data-need-card="tokens"]').hover();
      await page.waitForTimeout(300);
      assert.equal(await moving('tokens'), 0, 'a preview plays under reduced motion');
      await page.getByRole('switch', { name: 'Reduce motion' }).click();
    } finally { await browser.close(); }
  });

  test(`${name}: the signature scene opens the player and closes it, with the keyboard, and the focus follows`, async () => {
    const browser = await browserType.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      const pageErrors = [];
      page.on('pageerror', error => pageErrors.push(error.message));
      await page.goto(base + '/motion/', { waitUntil: 'load' });
      await page.waitForLoadState('networkidle');
      // The mini-player is named "Open the player"; once it is hidden it leaves the accessibility tree, so it is held by its attribute.
      await page.getByRole('button', { name: 'Open the player' }).waitFor();
      const mini = page.locator('[data-player-open]');
      await mini.focus();
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => document.activeElement === document.querySelector('[data-player-close]'));
      assert.equal(await mini.getAttribute('aria-expanded'), 'true');
      assert.equal(await page.getByRole('region', { name: 'Now playing' }).isVisible(), true);
      // The content arrives once the surface has grown; it is all there at rest.
      await page.waitForFunction(() => [...document.querySelectorAll('[data-player-item]')].every(el => !el.hidden));
      const play = page.getByRole('button', { name: 'Play', exact: true });
      await play.click();
      assert.equal(await page.getByRole('button', { name: 'Pause', exact: true }).getAttribute('aria-pressed'), 'true');
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => document.querySelector('[data-player-full]').hidden);
      assert.equal(await mini.evaluate(el => el === document.activeElement), true, 'focus did not return to the mini-player');
      assert.equal(await mini.getAttribute('aria-expanded'), 'false');
      // The bar ends at its own size: its content waits hidden, and the bar keeps its height meanwhile.
      await page.waitForFunction(() => document.querySelector('[data-player-open]').getAnimations({ subtree: true }).length === 0 && [...document.querySelectorAll('[data-player-mini-item]')].every(el => !el.hidden));
      assert.equal(Math.round((await mini.boundingBox()).height), 64);
      assert.deepEqual(pageErrors, []);
    } finally { await browser.close(); }
  });

  test(`${name}: one framework for the page: the principle's tabs, its result and the install command follow it, and it survives a reload`, async () => {
    const browser = await browserType.launch();
    try {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const page = await context.newPage();
      await page.goto(base + '/motion/', { waitUntil: 'load' });
      const install = () => page.locator('[data-copy-source]:not([hidden])').textContent();
      const result = () => page.locator('.result-variant:not([hidden])').evaluateAll(all => all.map(each => each.dataset.frameworkVariant));
      assert.equal(await install(), 'npm i @udixio/motion @udixio/ui-react');
      assert.deepEqual(await result(), ['react']);
      const principle = page.locator('[data-code-tabs]');
      await principle.getByRole('tab', { name: 'Angular', exact: true }).click();
      assert.equal(await install(), 'npm i @udixio/motion @udixio/ui-angular');
      assert.deepEqual(await result(), ['angular']);
      assert.match(await principle.locator('[role="tabpanel"]:not([hidden])').textContent(), /udxMotion="pop"/);
      await principle.getByRole('tab', { name: 'HTML', exact: true }).click();
      assert.equal(await install(), 'npm i @udixio/motion');
      await page.reload({ waitUntil: 'load' });
      assert.equal(await install(), 'npm i @udixio/motion');
      assert.equal(await principle.getByRole('tab', { name: 'HTML', exact: true }).getAttribute('aria-selected'), 'true');
      // The arrow keys move between the tabs.
      await principle.getByRole('tab', { name: 'HTML', exact: true }).focus();
      await page.keyboard.press('ArrowRight');
      assert.equal(await principle.getByRole('tab', { name: 'React', exact: true }).evaluate(el => el === document.activeElement), true);
      await page.keyboard.press('End');
      assert.equal(await principle.getByRole('tab', { name: 'Svelte', exact: true }).getAttribute('aria-selected'), 'true');
      await page.keyboard.press('ArrowRight');
      assert.equal(await principle.getByRole('tab', { name: 'HTML', exact: true }).evaluate(el => el === document.activeElement), true, 'ArrowRight does not wrap to HTML');
    } finally { await browser.close(); }
  });

  for (const framework of ['html', 'react', 'angular', 'svelte']) {
    test(`${name}: the principle's ${framework} example is the file shown, and it runs: Toggle plays the exit, then the entry`, async () => {
      const browser = await browserType.launch();
      try {
        const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'no-preference' });
        const page = await context.newPage();
        const pageErrors = [];
        page.on('pageerror', error => pageErrors.push(error.message));
        await page.goto(base + '/motion/', { waitUntil: 'load' });
        const extension = { html: 'html', react: 'tsx', angular: 'ts', svelte: 'svelte' }[framework];
        const source = (await readFile(new URL(`../src/examples/${framework}/motion-principle.${extension}`, import.meta.url), 'utf8')).trim();
        const principle = page.locator('[data-code-tabs]');
        await principle.getByRole('tab', { name: { html: 'HTML', react: 'React', angular: 'Angular', svelte: 'Svelte' }[framework], exact: true }).click();
        assert.equal((await principle.locator('[role="tabpanel"]:not([hidden]) pre').textContent()).trim(), source);
        // Sixteen lines at most, for every framework: React keeps a blank line between the definition and the component.
        assert.ok(source.split('\n').length <= 16, `the ${framework} example has ${source.split('\n').length} lines`);
        const variant = page.locator(`.result-variant[data-framework-variant="${framework}"]`);
        await variant.scrollIntoViewIfNeeded();
        const note = variant.locator('p', { hasText: 'Saved to your library' });
        await note.waitFor();
        // An island hydrates once its variant is shown: Toggle works once it has.
        const toggle = variant.getByRole('button', { name: 'Toggle' });
        await page.waitForLoadState('networkidle');
        await page.waitForFunction(selector => !document.querySelector(selector)?.closest('astro-island')?.hasAttribute('ssr'), `.result-variant[data-framework-variant="${framework}"] button`);
        await toggle.click();
        // The exit plays before the note is gone.
        await page.waitForFunction(selector => {
          const p = document.querySelector(selector);
          return !p || p.hidden || p.getAnimations().length > 0;
        }, `.result-variant[data-framework-variant="${framework}"] p`);
        await page.waitForFunction(selector => {
          const p = document.querySelector(selector);
          return !p || p.hidden;
        }, `.result-variant[data-framework-variant="${framework}"] p`, { timeout: 5000 });
        await toggle.click();
        await note.waitFor({ state: 'visible' });
        assert.deepEqual(pageErrors, []);
      } finally { await browser.close(); }
    });
  }

  test(`${name}: the facts read the size budgets of @udixio/motion and the verified engines`, async () => {
    const browser = await browserType.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      await page.goto(base + '/motion/', { waitUntil: 'load' });
      const budgets = JSON.parse(await readFile(new URL('../../../packages/motion/.size-limit.json', import.meta.url), 'utf8'));
      const core = budgets.find(entry => entry.name === 'core').limit;
      assert.equal((await page.locator('.fact-figure').first().textContent()).trim(), core.replace(/^(\d+(?:\.\d+)?)\s*kB$/, (_, value) => `${Number(value)} kB`));
      const rows = await page.locator('.weight').evaluateAll(all => all.map(row => [row.querySelector('.weight-path').textContent.trim(), row.querySelector('.weight-kb').firstChild.textContent.trim()]));
      const byPath = Object.fromEntries(rows);
      assert.equal(byPath['/layout'], `${Number(budgets.find(entry => entry.name === 'layout').limit.replace(' kB', ''))} kB`);
      assert.equal(byPath['/svg'], `${Number(budgets.find(entry => entry.name === 'svg').limit.replace(' kB', ''))} kB`);
      assert.deepEqual(await page.locator('.engine-name').evaluateAll(all => all.map(each => each.textContent.split(' ')[0])), ['Chromium', 'Firefox', 'WebKit']);
    } finally { await browser.close(); }
  });

  test(`${name}: below 560 px the framework select replaces the principle's tabs, chooses for the page and survives a reload`, async () => {
    const browser = await browserType.launch();
    try {
      const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
      const page = await context.newPage();
      await page.goto(base + '/motion/', { waitUntil: 'load' });
      const principle = page.locator('[data-code-tabs]');
      const select = principle.getByRole('combobox', { name: 'Framework of the example', exact: true });
      assert.equal(await select.isVisible(), true, 'the framework select is hidden at 375 px');
      assert.equal(await principle.getByRole('tablist').isVisible(), false, 'the tabs are shown at 375 px');
      assert.deepEqual(await select.locator('option').allTextContents(), ['HTML', 'React', 'Angular', 'Svelte']);
      assert.equal(await select.inputValue(), 'react');
      assert.equal(await principle.getByRole('button', { name: 'Copy the React code', exact: true }).isVisible(), true);
      await select.selectOption('svelte');
      assert.equal(await page.locator('[data-copy-source]:not([hidden])').textContent(), 'npm i @udixio/motion @udixio/ui-svelte');
      assert.equal(await principle.getByRole('button', { name: 'Copy the Svelte code', exact: true }).isVisible(), true);
      // The keyboard changes the choice too: the select is a native one.
      await select.focus();
      await page.keyboard.press('ArrowUp');
      assert.equal(await select.inputValue(), 'angular');
      await select.selectOption('svelte');
      await page.reload({ waitUntil: 'load' });
      assert.equal(await principle.locator('select[data-code-select]').inputValue(), 'svelte');
      assert.equal(await page.locator('[data-copy-source]:not([hidden])').textContent(), 'npm i @udixio/motion @udixio/ui-svelte');
    } finally { await browser.close(); }
  });

  test(`${name}: at 1280 px a usage block of a need page shows its pills and not its select`, async () => {
    const browser = await browserType.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      await page.goto(base + '/motion/lists/', { waitUntil: 'load' });
      const usage = page.locator('.motion-usage').first();
      assert.equal(await usage.locator('.code-framework-pills').isVisible(), true, 'the usage block shows no pills at 1280 px');
      assert.equal(await usage.locator('select').isVisible(), false, 'the usage block shows its select at 1280 px');
    } finally { await browser.close(); }
  });

  test(`${name}: below 560 px a usage block shows a framework select instead of its pills, and the choice is kept`, async () => {
    const browser = await browserType.launch();
    try {
      const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
      const page = await context.newPage();
      await page.goto(base + '/motion/lists/', { waitUntil: 'load' });
      const usage = page.locator('.motion-usage').first();
      assert.equal(await usage.locator('.code-framework-pills').isVisible(), false, 'the pills are shown at 375 px');
      const select = usage.getByRole('combobox', { name: 'Framework', exact: true });
      assert.equal(await select.isVisible(), true, 'the usage select is hidden at 375 px');
      assert.equal(await usage.getByRole('button', { name: 'Copy React code to clipboard', exact: true }).isVisible(), true);
      await select.selectOption('angular');
      const visible = () => usage.locator('[data-example-panel]:not([hidden])').evaluateAll(panels => panels.map(panel => `${panel.dataset.framework}/${panel.dataset.view}`));
      // The Preview view is the one shown: one panel, the Angular preview.
      await page.waitForFunction(() => document.querySelectorAll('.motion-usage [data-example-panel]:not([hidden])').length === 1);
      assert.deepEqual(await visible(), ['angular/preview']);
      await page.reload({ waitUntil: 'load' });
      // The server renders React; the island reads the stored choice once it has hydrated.
      await page.waitForFunction(() => document.querySelector('.motion-usage select')?.value === 'angular');
      assert.equal(await page.locator('.motion-usage select').first().inputValue(), 'angular');
      await page.waitForFunction(() => document.querySelectorAll('.motion-usage [data-example-panel]:not([hidden])').length === 1);
      assert.deepEqual(await visible(), ['angular/preview']);
    } finally { await browser.close(); }
  });

  test(`${name}: on the list page, Add three cascades in, and a Delete removes the focused item`, async () => {
    const browser = await browserType.launch();
    try {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'no-preference' });
      const page = await context.newPage();
      const pageErrors = [];
      page.on('pageerror', error => pageErrors.push(error.message));
      await page.goto(base + '/motion/lists/', { waitUntil: 'load' });
      const tile = page.locator('[data-motion-scene="inbox"]');
      await bringScene(page, '[data-motion-scene="inbox"]', '[data-motion-scene="inbox"] [data-inbox-list] > li');
      const items = '[data-motion-scene="inbox"] [data-inbox-list] > li';
      const count = () => page.locator(items).count();
      const waitForRest = () => page.waitForFunction(() => [...document.querySelectorAll('[data-motion-scene="inbox"] [data-inbox-list] *')].every(el => el.getAnimations().length === 0));
      const before = await count();
      await tile.getByRole('button', { name: 'Center', exact: true }).click();
      // The inline transform starts within 100 ms of the click, and the click is read in the same task.
      // The inline transform is the individual transform properties the runtime writes while a motion is in flight.
      const started = await page.evaluate(async () => {
        const begin = performance.now();
        const transformed = el => el.style.transform !== '' || el.style.translate !== '' || el.style.scale !== '';
        document.querySelector('[data-motion-scene="inbox"] [data-inbox-add="3"]').click();
        while (performance.now() - begin < 100) {
          if ([...document.querySelectorAll('[data-motion-scene="inbox"] [data-inbox-list] > li')].some(transformed)) return performance.now() - begin;
          await new Promise(resolve => requestAnimationFrame(resolve));
        }
        return null;
      });
      assert.ok(started !== null, 'no item has an inline transform within 100 ms of Add three');
      await waitForRest();
      assert.equal(await count(), before, 'the list did not keep its number of rows');
      const inline = await page.evaluate(() => [...document.querySelectorAll('[data-motion-scene="inbox"] [data-inbox-list] > li')]
        .filter(el => el.style.transform !== '' || el.style.translate !== '' || el.style.scale !== '').length);
      assert.equal(inline, 0, 'an item keeps an inline transform at rest');
      await page.locator(items).first().focus();
      await page.keyboard.press('Delete');
      await page.waitForFunction(([selector, expected]) => document.querySelectorAll(selector).length === expected, [items, before - 1]);
      await waitForRest();
      assert.deepEqual(pageErrors, []);
    } finally { await browser.close(); }
  });

  test(`${name}: reduced motion: on the list page Add three leaves no inline transform after a frame, and on the loop page no loop plays`, async () => {
    const browser = await browserType.launch();
    try {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      await page.goto(base + '/motion/lists/', { waitUntil: 'load' });
      await bringScene(page, '[data-motion-scene="inbox"]', '[data-motion-scene="inbox"] [data-inbox-list] > li');
      await page.evaluate(() => document.querySelector('[data-motion-scene="inbox"] [data-inbox-add="3"]').click());
      await frames(page);
      const transformed = await page.evaluate(() => [...document.querySelectorAll('[data-motion-scene="inbox"] [data-inbox-list] > li')]
        .filter(el => el.style.transform !== '' || el.style.translate !== '' || el.style.scale !== '').length);
      assert.equal(transformed, 0, 'an item moves under reduced motion');
      await page.waitForFunction(() => [...document.querySelectorAll('[data-motion-scene="inbox"] [data-inbox-list] *')].every(el => el.getAnimations().length === 0));

      await page.goto(base + '/motion/loop/', { waitUntil: 'load' });
      await bringScene(page, '[data-motion-scene="loop"]', '[data-motion-scene="loop"] [data-loop-pausable]');
      const running = await page.evaluate(() => [...document.querySelectorAll('[data-motion-scene="loop"] [data-loop-pausable]')]
        .flatMap(el => el.getAnimations())
        .filter(animation => animation.playState === 'running').length);
      assert.equal(running, 0, 'a loop plays under reduced motion');
    } finally { await browser.close(); }
  });

  for (const path of ['/motion/', '/motion/lists/', '/motion/sequences/']) {
    test(`${name}: ${path} has no horizontal scroll at 375 px`, async () => {
      const browser = await browserType.launch();
      try {
        const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
        await page.goto(base + path, { waitUntil: 'load' });
        await page.waitForLoadState('networkidle');
        await frames(page);
        const widths = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, inner: window.innerWidth }));
        assert.ok(widths.scroll <= widths.inner, `the page is ${widths.scroll} px wide in a ${widths.inner} px window`);
      } finally { await browser.close(); }
    });
  }

  test(`${name}: the sequence follows its ruler, forward and back`, async () => {
    const browser = await browserType.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      await page.goto(base + '/motion/sequences/', { waitUntil: 'load' });
      const title = '[data-launch-scene] [data-motion-step="title"]';
      await bringScene(page, '[data-motion-scene="launch"]', title);
      // Let the sequence play to its end first: the ruler then seeks a finished sequence.
      await page.waitForFunction(() => document.querySelector('[data-launch-scene]').getAnimations({ subtree: true }).length === 0, null, { timeout: 20000 });
      const seek = value => page.evaluate(to => {
        const ruler = document.querySelector('[data-launch-ruler]');
        ruler.value = String(to);
        ruler.dispatchEvent(new Event('input', { bubbles: true }));
      }, value);
      const opacity = () => page.evaluate(selector => getComputedStyle(document.querySelector(selector)).opacity, title);
      await seek(100);
      await frames(page);
      const early = Number(await opacity());
      assert.ok(early < 1, `the title is at opacity ${early} at 10 %, expected below 1`);
      await seek(1000);
      await frames(page);
      assert.equal(await opacity(), '1');
    } finally { await browser.close(); }
  });

  test(`${name}: the gallery opens and closes with the keyboard, and focus returns to its thumbnail`, async () => {
    const browser = await browserType.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      await page.goto(base + '/motion/shared-elements/', { waitUntil: 'load' });
      const thumb = page.locator('[data-gallery-thumb][data-motion-shared="shape-1"]');
      await bringScene(page, '[data-motion-scene="gallery"]', '[data-gallery-thumb][data-motion-shared="shape-1"]');
      await thumb.focus();
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => !document.getElementById('gallery-detail').hidden);
      await page.waitForFunction(() => document.activeElement === document.querySelector('[data-gallery-close]'));
      assert.equal(await thumb.getAttribute('aria-expanded'), 'true');
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => document.getElementById('gallery-detail').hidden === true);
      assert.equal(await thumb.evaluate(el => el === document.activeElement), true, 'focus did not return to the thumbnail');
      assert.equal(await thumb.getAttribute('aria-expanded'), 'false');
    } finally { await browser.close(); }
  });

  test(`${name}: the side panel marks the list page as the current one`, async () => {
    const browser = await browserType.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      await page.goto(base + '/motion/lists/', { waitUntil: 'load' });
      const link = page.getByRole('navigation', { name: 'Animation documentation' }).getByRole('link', { name: 'Make a list appear', exact: true });
      assert.equal(await link.getAttribute('aria-current'), 'page');
    } finally { await browser.close(); }
  });
}
