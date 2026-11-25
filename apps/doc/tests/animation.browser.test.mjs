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

/** The principle's tabs have the stored choice once their island has hydrated: a click before that reaches nothing. */
const principleHydrated = page => page.waitForFunction(() => !document.querySelector('[data-code-tabs] [data-code-ssr]'));

for (const name of browsers) {
  if (!Object.hasOwn(browserTypes, name)) throw new Error(`Unknown MOTION_BROWSERS entry: ${name}`);
  const browserType = browserTypes[name];

  test(`${name}: the root page is a showcase: a hero, the principle, real components, a card per need in the side panel's order, and the facts`, async () => {
    const browser = await browserType.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      await page.goto(base + '/motion/', { waitUntil: 'load' });
      await page.getByRole('heading', { level: 1, name: 'Material 3 motion, the same in every framework.' }).waitFor();
      const sections = await page.locator('.motion-page h2').allTextContents();
      assert.deepEqual(sections.map(text => text.trim()), ['One example, four frameworks', 'Your Udixio components already move with it', 'What it does', 'Browsers and weight']);
      const needs = MOTION_NEEDS.filter(need => need.scene);
      assert.equal(needs.length, 20);
      // One vocabulary: each card is a link named by its need (the subtitle of its page), to its page, with one API name; no
      // code, no control.
      const cards = await page.locator('[data-need-card]').evaluateAll(links => links.map(link => ({
        slug: link.dataset.needCard,
        href: link.getAttribute('href'),
        name: link.querySelector('.card-name').textContent.trim(),
        api: link.querySelector('.card-api')?.textContent.trim(),
        controls: link.querySelectorAll('button, input, select, pre').length,
      })));
      assert.deepEqual(cards, needs.map(need => ({ slug: need.slug, href: need.href, name: need.need ?? need.label, api: need.hints[0], controls: 0 })));
      // The chips speak one vocabulary: a function of the package, `defineMotion` and `defineValue` followed by the word of
      // their spec that makes the need. No preset, attribute, CSS variable or token name.
      const functions = ['defineMotion', 'defineValue', 'defineGesture', 'defineSequence', 'navigate', 'scrollTo', 'animateStyle', 'morph'];
      for (const { slug, api } of cards.filter(card => card.api !== undefined)) {
        assert.match(api, /^[a-z][A-Za-z]*( · [a-z]+)?$/, `${slug}: "${api}" is not a function, or a function and a word`);
        assert.ok(functions.includes(api.split(' · ')[0]), `${slug}: "${api}" does not start with a function of the package`);
      }
      for (const need of needs.slice(0, 3)) {
        assert.equal(await page.getByRole('link', { name: need.label, exact: true }).first().getAttribute('href'), need.href);
      }
      // One code block (the principle), no section bar, and no Reduce motion switch of its own: the site's one control is the
      // rail's toggle button. "Open the player" is a real button.
      assert.equal(await page.locator('[data-code-tabs]').count(), 1);
      assert.equal(await page.locator('[data-section-link]').count(), 0);
      assert.equal(await page.getByRole('switch').count(), 0);
      assert.equal(await page.getByRole('button', { name: 'Reduce motion', exact: true }).count(), 1);
      assert.equal(await page.getByRole('button', { name: 'Open the player', exact: true }).count(), 1);
      // The hero's stage is captioned with the parts of the library it plays, each linked to its page.
      const caption = page.locator('figure:has([data-motion-scene="player"]) figcaption');
      assert.deepEqual(await caption.locator('a').evaluateAll(links => links.map(link => link.getAttribute('href'))), ['/motion/shared-elements', '/motion/presence', '/motion/emphasis']);
      // Under the install command, one line says that no Udixio component is needed, for the chosen framework (React here).
      const noComponents = page.locator('[data-no-components]:not([hidden])');
      assert.equal(await noComponents.count(), 1);
      assert.match((await noComponents.textContent()).replace(/\s+/g, ' ').trim(), /^No Udixio component needed: <Motion>, <Presence> and useMotion work on any element of yours\. They ship in @udixio\/ui-react/);
    } finally { await browser.close(); }
  });

  test(`${name}: the root page plays by itself: the player opens and closes with no action, nothing else runs at the top, no task blocks the load, and the previews play as their cards enter, a few at a time`, async () => {
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
      const pageErrors = [];
      page.on('pageerror', error => pageErrors.push(error.message));
      await page.goto(base + '/motion/', { waitUntil: 'load' });
      await page.waitForTimeout(1000);
      // What runs at the top of the page belongs to the signature stage, and nothing else.
      const running = await page.evaluate(() => document.getAnimations()
        .filter(animation => animation.playState === 'running' && animation.timeline === document.timeline)
        .filter(animation => !animation.effect?.target?.closest?.('[data-motion-scene="player"]'))
        .map(animation => animation.effect?.target?.className ?? String(animation.effect?.target?.tagName)));
      assert.deepEqual(running, [], 'a time-based animation runs at the top of the page, outside the signature stage');
      if (name === 'chromium') {
        const longTasks = await page.evaluate(() => window.__longTasks);
        assert.deepEqual(longTasks.filter(duration => duration > 50), [], 'a task over 50 ms blocked the page during load');
      }
      // The player opens by itself, the bar growing into it (the morph moves the surface), then closes by itself; the focus
      // stays where it was.
      assert.equal(await page.locator('[data-motion-scene="player"]').getAttribute('data-player-autoplay'), 'on');
      await page.waitForFunction(() => {
        const full = document.querySelector('[data-player-full]');
        const moving = full.getAnimations({ subtree: true }).length > 0 || full.style.transform !== '' || full.style.translate !== '' || full.style.scale !== '';
        return !full.hidden && moving;
      }, null, { polling: 'raf', timeout: 5000 });
      assert.equal(await page.locator('[data-player-open][data-motion-shared]').getAttribute('aria-expanded'), 'true');
      await page.waitForFunction(() => document.querySelector('[data-player-full]').hidden, null, { timeout: 8000 });
      assert.equal(await page.evaluate(() => document.activeElement === document.body), true, 'the cycle moved the focus');
      // The previews' module loads with the gallery, not with the shell.
      const previewsLoaded = () => page.evaluate(() => performance.getEntriesByType('resource').some(entry => /\/previews[.-][^/]*\.js/.test(entry.name)));
      assert.equal(await previewsLoaded(), false, 'the previews module loads with the shell');
      await page.locator('[data-gallery]').scrollIntoViewIfNeeded();
      await page.waitForFunction(() => performance.getEntriesByType('resource').some(entry => /\/previews[.-][^/]*\.js/.test(entry.name)));
      // The previews play as their cards enter, without a hover, and never more than three at once.
      const most = await page.evaluate(() => new Promise(resolve => {
        const begin = performance.now();
        let most = 0;
        let seen = 0;
        const sample = () => {
          const moving = [...document.querySelectorAll('[data-preview]')].filter(el => el.getAnimations({ subtree: true }).length > 0).length;
          most = Math.max(most, moving);
          if (moving > 0) seen++;
          if (performance.now() - begin < 4000) requestAnimationFrame(sample);
          else resolve({ most, seen });
        };
        requestAnimationFrame(sample);
      }));
      assert.ok(most.seen > 0, 'no preview played when its card entered the view');
      assert.ok(most.most <= 3, `${most.most} previews played at once`);
      assert.deepEqual(pageErrors, []);
    } finally { await browser.close(); }
  });

  test(`${name}: under reduced motion the root page is still: the player stays closed, nothing runs at the top, no preview plays; the site's policy stops a cycle under way`, async () => {
    const browser = await browserType.launch();
    try {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      await page.goto(base + '/motion/', { waitUntil: 'load' });
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2500);
      const stage = page.locator('[data-motion-scene="player"]');
      assert.equal(await stage.getAttribute('data-player-autoplay'), 'off');
      assert.equal(await page.locator('[data-player-full]').evaluate(el => el.hidden), true, 'the player opened under reduced motion');
      const running = await page.evaluate(() => document.getAnimations().filter(animation => animation.playState === 'running').length);
      assert.equal(running, 0, 'an animation runs under reduced motion');
      await page.locator('[data-gallery]').scrollIntoViewIfNeeded();
      await page.waitForFunction(() => performance.getEntriesByType('resource').some(entry => /\/previews[.-][^/]*\.js/.test(entry.name)));
      await page.waitForTimeout(1500);
      const playing = await page.evaluate(() => [...document.querySelectorAll('[data-preview]')].flatMap(el => el.getAnimations({ subtree: true })).length);
      assert.equal(playing, 0, 'a preview plays under reduced motion');

      // The site's policy (the rail's control writes it on <html>) stops a cycle under way: the player it opened closes.
      await context.close();
      const moving = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'no-preference' });
      const second = await moving.newPage();
      await second.goto(base + '/motion/', { waitUntil: 'load' });
      await second.waitForFunction(() => !document.querySelector('[data-player-full]').hidden, null, { timeout: 5000 });
      await second.evaluate(() => document.documentElement.setAttribute('data-motion-policy', 'reduce'));
      await second.waitForFunction(() => document.querySelector('[data-player-full]').hidden);
      assert.equal(await second.locator('[data-motion-scene="player"]').getAttribute('data-player-autoplay'), 'off');
      await second.waitForTimeout(2500);
      assert.equal(await second.locator('[data-player-full]').evaluate(el => el.hidden), true, 'the cycle ran under the site\'s reduced motion');
    } finally { await browser.close(); }
  });

  test(`${name}: a card's preview plays again when the card is hovered or focused, and comes back to rest; under reduced motion it stays still`, async () => {
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
      // The cards in view play once on entering it: let that wave end, so what follows is the hover's and the focus's doing.
      await page.waitForTimeout(600);
      await page.waitForFunction(() => [...document.querySelectorAll('[data-preview]')].every(el => el.getAnimations({ subtree: true }).length === 0), null, { timeout: 20000 });
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
      // The site's policy holds them (the rail's Reduce motion control writes it on <html>).
      await page.evaluate(() => document.documentElement.setAttribute('data-motion-policy', 'reduce'));
      await page.locator('[data-need-card="tokens"]').hover();
      await page.waitForTimeout(300);
      assert.equal(await moving('tokens'), 0, 'a preview plays under reduced motion');
    } finally { await browser.close(); }
  });

  test(`${name}: the signature scene opens the player and closes it, from its button and with the keyboard, the focus follows, and a hover holds its cycle`, async () => {
    const browser = await browserType.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      const pageErrors = [];
      page.on('pageerror', error => pageErrors.push(error.message));
      await page.goto(base + '/motion/', { waitUntil: 'load' });
      await page.waitForLoadState('networkidle');
      // A pointer on the stage holds the cycle; a player the cycle opened is closed first.
      const stage = page.locator('[data-motion-scene="player"]');
      await stage.hover({ position: { x: 40, y: 40 } });
      await page.waitForFunction(() => document.querySelector('[data-motion-scene="player"]').dataset.playerAutoplay === 'held');
      if (!(await page.locator('[data-player-full]').evaluate(el => el.hidden))) await page.locator('[data-player-close]').click();
      await page.waitForFunction(() => document.querySelector('[data-player-full]').hidden);
      // "Open the player" is a button: it opens the player, the focus goes to Close, and comes back to it on Escape.
      const caption = page.getByRole('button', { name: 'Open the player', exact: true });
      await caption.waitFor();
      await caption.click();
      await page.waitForFunction(() => document.activeElement === document.querySelector('[data-player-close]'));
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => document.querySelector('[data-player-full]').hidden);
      await page.waitForFunction(() => document.activeElement?.matches('[data-player-caption] button'));
      // The mini-player opens it from the keyboard; once it is hidden it leaves the accessibility tree, so it is held by its attribute.
      const mini = page.locator('[data-player-open][data-motion-shared]');
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
      // Once the pointer and the focus have left the stage, the cycle plays again.
      await page.mouse.move(2, 2);
      await mini.evaluate(el => el.blur());
      await page.waitForFunction(() => document.querySelector('[data-motion-scene="player"]').dataset.playerAutoplay === 'on');
      assert.deepEqual(pageErrors, []);
    } finally { await browser.close(); }
  });

  test(`${name}: one framework for the page: the principle's tabs, its result and the install command follow it, and it survives a reload`, async () => {
    const browser = await browserType.launch();
    try {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const page = await context.newPage();
      await page.goto(base + '/motion/', { waitUntil: 'load' });
      await principleHydrated(page);
      const install = () => page.locator('[data-copy-source]:not([hidden])').textContent();
      const result = () => page.locator('.result-variant:not([hidden])').evaluateAll(all => all.map(each => each.dataset.frameworkVariant));
      assert.equal(await install(), 'npm i @udixio/motion @udixio/ui-react');
      assert.deepEqual(await result(), ['react']);
      const principle = page.locator('[data-code-tabs]');
      await principle.getByRole('tab', { name: 'Angular', exact: true }).click();
      assert.equal(await install(), 'npm i @udixio/motion @udixio/core @udixio/ui-angular');
      assert.deepEqual(await result(), ['angular']);
      assert.match(await principle.locator('[role="tabpanel"]:not([hidden])').textContent(), /udxMotion="pop"/);
      await principle.getByRole('tab', { name: 'HTML', exact: true }).click();
      assert.equal(await install(), 'npm i @udixio/motion');
      await page.reload({ waitUntil: 'load' });
      assert.equal(await install(), 'npm i @udixio/motion');
      assert.equal(await principle.getByRole('tab', { name: 'HTML', exact: true }).getAttribute('aria-selected'), 'true');
      // The island remounts its tabs once it has the stored choice: focus them after that, not before.
      await principleHydrated(page);
      // The arrow keys move between the tabs, and wrap as the code blocks' tabs do (Udixio's Tabs).
      await principle.getByRole('tab', { name: 'HTML', exact: true }).focus();
      await page.keyboard.press('ArrowRight');
      assert.equal(await principle.getByRole('tab', { name: 'React', exact: true }).evaluate(el => el === document.activeElement), true);
      await page.keyboard.press('End');
      assert.equal(await principle.getByRole('tab', { name: 'Svelte', exact: true }).getAttribute('aria-selected'), 'true');
      await page.keyboard.press('ArrowRight');
      assert.equal(await principle.getByRole('tab', { name: 'HTML', exact: true }).evaluate(el => el === document.activeElement), true, 'ArrowRight wraps to HTML');
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
        await principleHydrated(page);
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

  test(`${name}: the facts print the measured weight of the core and the oldest supported browsers, and link the detail`, async () => {
    const browser = await browserType.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      await page.goto(base + '/motion/', { waitUntil: 'load' });
      // The weights are measured (packages/motion/size-report.json), gzipped, printed in kB with one decimal.
      const report = JSON.parse(await readFile(new URL('../../../packages/motion/size-report.json', import.meta.url), 'utf8'));
      const kb = bytes => `${Number((bytes / 1000).toFixed(1))} kB`;
      assert.equal((await page.locator('.fact-figure').first().textContent()).trim(), kb(report.entries.core));
      // The root page holds the weight of the core, and no weight table: the table of every import path is on Loading and
      // weight.
      const weightRows = () => page.locator('.weight').evaluateAll(all => all.map(row => [row.querySelector('.weight-path').textContent.trim(), row.querySelector('.weight-kb').firstChild.textContent.trim()]));
      assert.equal(await page.locator('.weight').count(), 0, 'the weight table is back on the root page');
      assert.equal((await page.locator('[data-core-weight]').textContent()).trim(), kb(report.entries.core));
      // The oldest browser of each engine, as four pills; the features the package falls back from are on Loading and weight.
      const browsers = await page.locator('[aria-label="Oldest supported browsers"] > li > span:first-child').evaluateAll(all => all.map(each => each.textContent.replace(/\s+/g, ' ').trim()));
      assert.deepEqual(browsers.map(text => text.split(' · ')[0]), ['Chrome 109+', 'Firefox 153+', 'Safari 26.6+', 'iOS Safari 18.5+']);
      assert.equal(await page.locator('.motion-page table tbody th').count(), 0, 'the feature table left the root page');
      assert.equal(await page.locator('.facts-link').getAttribute('href'), '/motion/loading-and-weight');
      await page.goto(base + '/motion/loading-and-weight', { waitUntil: 'load' });
      assert.deepEqual(await page.locator('table tbody th').allTextContents(), ['linear() easing', 'View Transitions', 'view timeline', '@property']);
      const byPath = Object.fromEntries(await weightRows());
      assert.equal(byPath['/layout'], kb(report.entries.layout));
      assert.equal(byPath['/svg'], kb(report.entries.svg));
      assert.equal(byPath['@udixio/ui-react'], kb(report.adapters.react));
      assert.equal(Object.keys(byPath).length, Object.keys(report.entries).length + Object.keys(report.adapters).length, 'the full table lists every measured entry and every adapter');
    } finally { await browser.close(); }
  });

  test(`${name}: the principle's HTML result is its example file: HtmlExample renders it and the page runs its script`, async () => {
    const browser = await browserType.launch();
    try {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'no-preference' });
      const page = await context.newPage();
      const pageErrors = [];
      page.on('pageerror', error => pageErrors.push(error.message));
      await page.goto(base + '/motion/', { waitUntil: 'load' });
      // Not a copy: the result holds the example's Toggle, and the marker the layout runs the example's script from.
      const result = page.locator('[data-principle-html]');
      assert.equal(await result.locator('#toggle').count(), 1, 'the HTML result has no Toggle of the example');
      const marker = 'template[data-html-example="motion-principle"]';
      assert.equal(await result.locator(marker).count(), 1, 'the HTML result is not rendered from the example file');
      assert.deepEqual(pageErrors, []);
    } finally { await browser.close(); }
  });

  test(`${name}: below 560 px the principle keeps its framework tabs in its card, with no select, chooses for the page and survives a reload`, async () => {
    const browser = await browserType.launch();
    try {
      const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
      const page = await context.newPage();
      await page.goto(base + '/motion/', { waitUntil: 'load' });
      await principleHydrated(page);
      const principle = page.locator('[data-code-tabs]');
      const tabs = principle.getByRole('tablist', { name: 'Framework of the example', exact: true });
      assert.equal(await tabs.isVisible(), true, 'the framework tabs are hidden at 375 px');
      assert.equal(await principle.locator('select').count(), 0, 'the principle still has a native select');
      assert.deepEqual(await tabs.getByRole('tab').allTextContents(), ['HTML', 'React', 'Angular', 'Svelte']);
      assert.equal(await tabs.getByRole('tab', { name: 'React', exact: true }).getAttribute('aria-selected'), 'true');
      assert.equal(await principle.getByRole('button', { name: 'Copy the React code', exact: true }).isVisible(), true);
      // The tabs stay inside the card; the page itself does not scroll sideways.
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth) <= 375, 'the page scrolls sideways at 375 px');
      await tabs.getByRole('tab', { name: 'Svelte', exact: true }).click();
      assert.equal(await page.locator('[data-copy-source]:not([hidden])').textContent(), 'npm i @udixio/motion @udixio/core @udixio/ui-svelte');
      // The copy button is an island: it takes the new name once it has hydrated and rendered the choice.
      await principle.getByRole('button', { name: 'Copy the Svelte code', exact: true }).waitFor({ state: 'visible' });
      // The keyboard changes the choice too: the arrows move between the shared tabs.
      await tabs.getByRole('tab', { name: 'Svelte', exact: true }).focus();
      await page.keyboard.press('ArrowLeft');
      assert.equal(await tabs.getByRole('tab', { name: 'Angular', exact: true }).getAttribute('aria-selected'), 'true');
      await page.reload({ waitUntil: 'load' });
      assert.equal(await tabs.getByRole('tab', { name: 'Angular', exact: true }).getAttribute('aria-selected'), 'true');
      assert.equal(await page.locator('[data-copy-source]:not([hidden])').textContent(), 'npm i @udixio/motion @udixio/core @udixio/ui-angular');
    } finally { await browser.close(); }
  });

  test(`${name}: before its islands hydrate, the principle shows the stored framework (its tab, panel, result and copy button), and with JavaScript off it shows React`, async () => {
    const browser = await browserType.launch();
    try {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const page = await context.newPage();
      await page.goto(base + '/motion/', { waitUntil: 'load' });
      await page.evaluate(() => localStorage.setItem('udixio:docs:preferred-example-framework', 'svelte'));
      // No island script loads: what is shown is what the server rendered, and what the layout's head script applied.
      await page.route('**/*', route => (route.request().resourceType() === 'script' ? route.abort() : route.continue()));
      await page.reload({ waitUntil: 'load' });
      const principle = page.locator('[data-code-tabs]');
      assert.equal(await principle.getByRole('tab', { name: 'Svelte', exact: true }).getAttribute('aria-selected'), 'true');
      assert.equal(await principle.locator('[data-code-ssr]').count(), 1, 'the toolbar holds data-code-ssr until its island has the stored choice');
      assert.equal(await principle.locator('[role="tabpanel"]:not([hidden])').getAttribute('data-framework'), 'svelte');
      assert.deepEqual(await page.locator('.result-variant:not([hidden])').evaluateAll(all => all.map(each => each.dataset.frameworkVariant)), ['svelte']);
      assert.equal(await page.locator('[data-copy-source]:not([hidden])').textContent(), 'npm i @udixio/motion @udixio/core @udixio/ui-svelte');
      assert.equal(await principle.getByRole('button', { name: 'Copy the Svelte code', exact: true }).count(), 1);
      // With JavaScript off, nothing reads the stored choice: the server's framework, React, is the one shown.
      const plain = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 900 } });
      const noScript = await plain.newPage();
      await noScript.goto(base + '/motion/', { waitUntil: 'load' });
      const plainPrinciple = noScript.locator('[data-code-tabs]');
      assert.equal(await plainPrinciple.getByRole('tab', { name: 'React', exact: true }).getAttribute('aria-selected'), 'true');
      assert.deepEqual(await noScript.locator('.result-variant:not([hidden])').evaluateAll(all => all.map(each => each.dataset.frameworkVariant)), ['react']);
      assert.equal(await plainPrinciple.getByRole('button', { name: 'Copy the React code', exact: true }).count(), 1);
    } finally { await browser.close(); }
  });

  test(`${name}: at 1280 px the demo of a need page shows its framework tabs and its copy button on one row, with no view switch`, async () => {
    const browser = await browserType.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      await page.goto(base + '/motion/lists/', { waitUntil: 'load' });
      // The split demo: its code and its preview, with the framework tabs and the copy button of the code block.
      const usage = page.locator('.motion-usage').first();
      // The framework tabs remount once when they sync with the stored choice: measure after that.
      await page.waitForFunction(() => !document.querySelector('.motion-usage [data-code-ssr]'));
      const tabs = usage.getByRole('tablist', { name: 'Example framework', exact: true });
      assert.equal(await tabs.isVisible(), true, 'the demo shows no framework tabs at 1280 px');
      assert.deepEqual(await tabs.getByRole('tab').allTextContents(), ['HTML', 'React', 'Angular', 'Svelte']);
      assert.equal(await usage.getByRole('group', { name: 'Example view', exact: true }).count(), 0, 'a split demo has a view switch');
      // The toolbar's controls are islands: wait until each has rendered before measuring it.
      const middle = async locator => { await locator.waitFor({ state: 'visible' }); const box = await locator.boundingBox(); return box.y + box.height / 2; };
      const row = await middle(tabs);
      const copy = usage.getByRole('button', { name: 'Copy React code to clipboard', exact: true });
      assert.ok(Math.abs((await middle(copy)) - row) < 2, 'the copy button is not on the row of the tabs');
    } finally { await browser.close(); }
  });

  test(`${name}: below 560 px the demo of a need page keeps its framework tabs, scrolling, and the choice is kept`, async () => {
    const browser = await browserType.launch();
    try {
      const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
      const page = await context.newPage();
      const hydrated = () => page.waitForFunction(() => document.querySelectorAll('.motion-usage [data-code-ssr]').length === 0);
      await page.goto(base + '/motion/lists/', { waitUntil: 'load' });
      await hydrated();
      const usage = page.locator('.motion-usage').first();
      const tabs = usage.getByRole('tablist', { name: 'Example framework', exact: true });
      assert.equal(await tabs.isVisible(), true, 'the framework tabs are hidden at 375 px');
      assert.equal(await usage.locator('select').count(), 0, 'the usage block still has a select');
      // The tabs scroll inside the card; the page itself does not scroll sideways.
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth) <= 375, 'the page scrolls sideways at 375 px');
      const copy = usage.getByRole('button', { name: 'Copy React code to clipboard', exact: true });
      assert.equal(await copy.isVisible(), true);
      await tabs.getByRole('tab', { name: 'Angular', exact: true }).click();
      const visible = () => usage.locator('[data-example-panel]:not([hidden])').evaluateAll(panels => panels.map(panel => `${panel.dataset.framework}/${panel.dataset.view}`));
      // A split demo shows the preview and the code of the chosen framework, the preview first: here the Angular ones.
      await page.waitForFunction(() => document.querySelector('.motion-usage [data-example-panel][data-framework="angular"][data-view="preview"]:not([hidden])') !== null);
      assert.deepEqual(await visible(), ['angular/preview', 'angular/code']);
      await page.reload({ waitUntil: 'load' });
      // The head script selects the stored tab before the first paint, and the island keeps it once it has hydrated.
      assert.equal(await tabs.getByRole('tab', { name: 'Angular', exact: true }).getAttribute('aria-selected'), 'true');
      await hydrated();
      assert.equal(await tabs.getByRole('tab', { name: 'Angular', exact: true }).getAttribute('aria-selected'), 'true');
      assert.deepEqual(await visible(), ['angular/preview', 'angular/code']);
    } finally { await browser.close(); }
  });

  test(`${name}: a motion page has one measure: prose of at most 672 px, and every wide block (code, demo, table) one width and one left edge`, async () => {
    const browser = await browserType.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 1920, height: 900 } });
      // [viewport, prose width, wide width]: at 1280 the column is narrower than the measure, and the wide blocks reach
      // 16 px into the article's padding on each side, as the split demo did before (review 6, M1 and Y6).
      for (const [width, prose, wide] of [[1920, 672, 1024], [1440, 672, 855], [1280, 631, 695]]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(base + '/motion/presence/', { waitUntil: 'load' });
        const measure = await page.evaluate(() => {
          const article = document.querySelector('article');
          const box = element => { const rect = element.getBoundingClientRect(); return { left: Math.round(rect.left), width: Math.round(rect.width) }; };
          const shown = element => element.getClientRects().length > 0;
          const children = [...article.children].flatMap(child => (child.classList.contains('contents') ? [...child.children] : [child])).filter(shown);
          const prose = children.filter(child => child.matches('p, h2, h3, ul, header, dl'));
          const wide = children.filter(child => child.matches('.card-code, .motion-usage, :has(> table)'));
          const choices = article.querySelector('#when-to-use-it + ul');
          const cards = [...choices.children].filter(card => card.matches('li') && shown(card));
          const rows = new Map();
          for (const card of cards) rows.set(Math.round(card.getBoundingClientRect().top), [...(rows.get(Math.round(card.getBoundingClientRect().top)) ?? []), box(card)]);
          return { prose: prose.map(box), wide: wide.map(box), choices: box(choices), rows: [...rows.values()] };
        });
        assert.ok(measure.prose.length > 5 && measure.wide.length > 3, `${width}: too few blocks measured`);
        assert.deepEqual([...new Set(measure.prose.map(each => each.width))], [prose], `${width}: the prose widths`);
        assert.equal(new Set(measure.prose.map(each => each.left)).size, 1, `${width}: the prose has several left edges`);
        assert.deepEqual([...new Set(measure.wide.map(each => each.width))], [wide], `${width}: the wide block widths`);
        assert.equal(new Set(measure.wide.map(each => each.left)).size, 1, `${width}: the wide blocks have several left edges`);
        // Prose and wide blocks are centred on the same axis.
        const middle = each => each.left + each.width / 2;
        assert.ok(Math.abs(middle(measure.prose[0]) - middle(measure.wide[0])) <= 1, `${width}: the prose and the wide blocks are not on one axis`);
        // The "When to use it" cards fill their rows: the lead card alone, then the others side by side, edge to edge.
        for (const row of measure.rows) {
          const right = Math.max(...row.map(card => card.left + card.width));
          assert.ok(Math.abs(row[0].left - measure.choices.left) <= 1 && Math.abs(right - (measure.choices.left + measure.choices.width)) <= 1, `${width}: a row of cards does not fill the grid: ${JSON.stringify(row)}`);
        }
        assert.equal(measure.rows[1]?.length, 3, `${width}: the three "Prefer it when" cards do not share a row`);
      }
    } finally { await browser.close(); }
  });

  test(`${name}: the split demo keeps its preview in view: beside the code it sticks, stacked it comes first, and a long code is folded behind a button`, async () => {
    const browser = await browserType.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 1920, height: 900 } });
      await page.goto(base + '/motion/presence/', { waitUntil: 'load' });
      const card = page.locator('[data-code-layout="split"]').first();
      const preview = card.locator('[data-example-panel][data-framework="react"][data-view="preview"]');
      const code = card.locator('[data-example-panel][data-framework="react"][data-view="code"]');
      // Beside the code: the example (the surface in the preview cell) stays 24 px under the top of the viewport while the
      // code scrolls past it.
      await card.evaluate(element => window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY + 300));
      await frames(page);
      const example = await preview.evaluate(panel => Math.round(panel.firstElementChild.getBoundingClientRect().top));
      assert.equal(example, 24, `the example of the split demo does not stick: its top is at ${example} px`);

      // The code is folded to 24 lines (24 x 28 px), with the rest behind a disclosure button.
      const source = code.locator('[id$="-react-source"]');
      const folded = await source.evaluate(element => ({ height: element.clientHeight, full: element.scrollHeight }));
      assert.equal(folded.height, 672, `the folded code is ${folded.height} px high`);
      assert.ok(folded.full > folded.height, 'the folded code hides nothing');
      const button = code.getByRole('button', { name: /^Show all \d+ lines$/ });
      await button.waitFor();
      assert.equal(await button.getAttribute('aria-expanded'), 'false');
      assert.equal(await button.getAttribute('aria-controls'), await source.getAttribute('id'));
      // The island hydrates when it is visible: click once it is.
      await button.scrollIntoViewIfNeeded();
      await page.waitForFunction(() => !document.querySelector('astro-island[ssr] [aria-controls$="-react-source"]'));
      await button.click();
      const less = code.getByRole('button', { name: 'Show less', exact: true });
      await less.waitFor();
      assert.equal(await less.getAttribute('aria-expanded'), 'true');
      const unfolded = await source.evaluate(element => ({ height: element.clientHeight, full: element.scrollHeight }));
      assert.equal(unfolded.height, unfolded.full, 'the unfolded code still hides lines');
      await less.click();
      await code.getByRole('button', { name: /^Show all \d+ lines$/ }).waitFor();
      assert.equal(await source.evaluate(element => element.clientHeight), 672, 'the code does not fold again');

      // A short code is shown whole, with no button: the Emphasis demo has 22 lines in React.
      await page.goto(base + '/motion/emphasis/', { waitUntil: 'load' });
      assert.equal(await page.locator('[data-code-layout="split"] [data-view="code"][data-framework="react"] button').count(), 0, 'a short code is folded');

      // Stacked (a 1280 px viewport gives a card under 768 px): the preview comes first, above its code.
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(base + '/motion/presence/', { waitUntil: 'load' });
      const [top, below] = await Promise.all([preview.boundingBox(), code.boundingBox()]);
      assert.ok(top.y + top.height <= below.y + 1, `the preview (${top.y}..${top.y + top.height}) is not above its code (${below.y})`);
      assert.ok(Math.abs(top.x - below.x) <= 1 && Math.abs(top.width - below.width) <= 1, 'stacked, the preview and the code are not one column');
    } finally { await browser.close(); }
  });

  test(`${name}: on the list page, Add three moves the tracks in at once, and none keeps an inline transform at rest`, async () => {
    const browser = await browserType.launch();
    try {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'no-preference' });
      const page = await context.newPage();
      const pageErrors = [];
      page.on('pageerror', error => pageErrors.push(error.message));
      await page.goto(base + '/motion/lists/', { waitUntil: 'load' });
      const panel = '[data-example-panel][data-framework="react"][data-view="preview"]';
      const items = `${panel} ul > li`;
      await bringScene(page, panel, items);
      const count = () => page.locator(items).count();
      const waitForRest = () => page.waitForFunction(selector => [...document.querySelectorAll(selector)].every(el => el.getAnimations().length === 0), `${panel} ul *`);
      // A track starts its move within 100 ms of the click, and the click is read in the same task.
      const started = await page.evaluate(async scope => {
        const begin = performance.now();
        [...document.querySelector(scope).querySelectorAll('button')].find(button => button.textContent.trim() === 'Add three').click();
        while (performance.now() - begin < 100) {
          if ([...document.querySelectorAll(`${scope} ul > li`)].some(el => el.getAnimations().length > 0)) return performance.now() - begin;
          await new Promise(resolve => requestAnimationFrame(resolve));
        }
        return null;
      }, panel);
      assert.ok(started !== null, 'no track starts a move within 100 ms of Add three');
      await waitForRest();
      assert.equal(await count(), 5, 'the queue does not keep five tracks');
      const inline = await page.evaluate(selector => [...document.querySelectorAll(selector)]
        .filter(el => el.style.transform !== '' || el.style.translate !== '' || el.style.scale !== '').length, items);
      assert.equal(inline, 0, 'a track keeps an inline transform at rest');
      assert.deepEqual(pageErrors, []);
    } finally { await browser.close(); }
  });

  test(`${name}: reduced motion: on the list page Add three leaves no inline transform after a frame, and on the loop page no loop plays`, async () => {
    const browser = await browserType.launch();
    try {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      await page.goto(base + '/motion/lists/', { waitUntil: 'load' });
      const panel = '[data-example-panel][data-framework="react"][data-view="preview"]';
      await bringScene(page, panel, `${panel} ul > li`);
      await page.evaluate(scope => [...document.querySelector(scope).querySelectorAll('button')].find(button => button.textContent.trim() === 'Add three').click(), panel);
      await frames(page);
      const transformed = await page.evaluate(selector => [...document.querySelectorAll(selector)]
        .filter(el => el.style.transform !== '' || el.style.translate !== '' || el.style.scale !== '').length, `${panel} ul > li`);
      assert.equal(transformed, 0, 'an item moves under reduced motion');
      await page.waitForFunction(selector => [...document.querySelectorAll(selector)].every(el => el.getAnimations().length === 0), `${panel} ul *`);

      await page.goto(base + '/motion/loop/', { waitUntil: 'load' });
      // The demo is the React example: its three bars are the loops.
      const demo = '[data-example-panel][data-framework="react"][data-view="preview"]';
      await bringScene(page, demo, `${demo} span.origin-bottom`);
      const running = await page.evaluate(selector => [...document.querySelectorAll(selector)]
        .flatMap(el => el.getAnimations())
        .filter(animation => animation.playState === 'running').length, `${demo} span.origin-bottom`);
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

  // The rail's menu extends the rail and opens the section's panel beside it; the search opens its panel beside the rail.
  // On a phone, both panels are narrowed to the room left by the rail, so the page never scrolls sideways.
  for (const [control, panel] of [['Open menu', 'Animation'], ['Search', 'Search documentation']]) {
    test(`${name}: ${control} opens its panel with no horizontal scroll at 375 px`, async () => {
      const browser = await browserType.launch();
      try {
        const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
        await page.goto(base + '/motion/', { waitUntil: 'load' });
        const rail = 'astro-island[component-export="Navigation"]';
        await page.waitForFunction(selector => !document.querySelector(selector)?.hasAttribute('ssr'), rail);
        await frames(page);
        await page.locator(`${rail} button[aria-label="${control}"]`).first().click();
        const sheet = page.locator(`${rail} .side-sheet[aria-label="${panel}"]`);
        await sheet.waitFor({ state: 'visible' });
        // The panel opens over a spring: its width is read once it is still.
        await page.waitForFunction(selector => document.querySelector(selector).getAnimations({ subtree: true }).length === 0, `${rail} .side-sheet[aria-label="${panel}"]`);
        const widths = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, inner: window.innerWidth }));
        assert.ok(widths.scroll <= widths.inner, `with the panel open, the page is ${widths.scroll} px wide in a ${widths.inner} px window`);
        const box = await sheet.boundingBox();
        assert.ok(box.x + box.width <= widths.inner + 0.5, `the panel ends at ${box.x + box.width} px`);
      } finally { await browser.close(); }
    });
  }

  test(`${name}: the sequence follows its slider, forward and back`, async () => {
    const browser = await browserType.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      await page.goto(base + '/motion/sequences/', { waitUntil: 'load' });
      const timeline = page.locator('[data-example-panel][data-framework="react"][data-view="preview"]').nth(1);
      await timeline.scrollIntoViewIfNeeded();
      await page.waitForFunction(() => {
        const panel = document.querySelectorAll('[data-example-panel][data-framework="react"][data-view="preview"]')[1];
        const islands = panel ? [...panel.querySelectorAll('astro-island')] : [];
        return islands.length > 0 && islands.every(island => !island.hasAttribute('ssr'));
      }, null, { timeout: 60000 });
      const readout = () => timeline.locator('output').textContent();
      // The slider is a Udixio Slider: the visitor seeks it with the keyboard (Home: start, End: end).
      const slider = timeline.getByRole('slider', { name: 'Sequence time' });
      await slider.focus();
      await page.keyboard.press('End');
      await page.waitForFunction(() => parseFloat(document.querySelectorAll('[data-example-panel][data-framework="react"][data-view="preview"]')[1].querySelector('output').textContent) > 0);
      const end = await readout();
      await page.keyboard.press('Home');
      await page.waitForFunction(() => document.querySelectorAll('[data-example-panel][data-framework="react"][data-view="preview"]')[1].querySelector('output').textContent.startsWith('0'));
      assert.notEqual(end, '0 ms', 'the end of the sequence reads 0 ms');
      assert.equal(await readout(), '0 ms');
    } finally { await browser.close(); }
  });

  test(`${name}: the cover opens and closes with the keyboard, and the focus goes with it`, async () => {
    const browser = await browserType.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      await page.goto(base + '/motion/shared-elements/', { waitUntil: 'load' });
      const panel = '[data-example-panel][data-framework="react"][data-view="preview"]';
      const cover = page.locator(`${panel} button[aria-label="Open the player"]`);
      await bringScene(page, panel, `${panel} button[aria-label="Open the player"]`);
      await cover.focus();
      await page.keyboard.press('Enter');
      // The focus moves into the player, and Tab reaches its Close button.
      await page.waitForFunction(selector => document.querySelector(selector)?.contains(document.activeElement) === true, `${panel} div[tabindex="-1"]`);
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');
      await page.waitForFunction(selector => document.querySelector(selector) === null, `${panel} div[tabindex="-1"]`);
      await page.waitForFunction(selector => document.activeElement === document.querySelector(selector), `${panel} button[aria-label="Open the player"]`);
      assert.equal(await cover.evaluate(el => el === document.activeElement), true, 'focus did not return to the cover');
    } finally { await browser.close(); }
  });

  test(`${name}: the side panel marks the list page as the current one`, async () => {
    const browser = await browserType.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      await page.goto(base + '/motion/lists/', { waitUntil: 'load' });
      const link = page.getByRole('navigation', { name: 'Animation documentation' }).getByRole('link', { name: 'Lists', exact: true });
      assert.equal(await link.getAttribute('aria-current'), 'page');
    } finally { await browser.close(); }
  });
}
