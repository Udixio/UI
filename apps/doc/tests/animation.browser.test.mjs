// Run against a built site: MOTION_BROWSERS=chromium,firefox,webkit MOTION_DOC_URL=http://localhost:4322 node --test tests/animation.browser.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium, firefox, webkit } from 'playwright';
import { MOTION_NEEDS, MOTION_SECTIONS } from '../src/lib/motion-nav.ts';

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
      assert.equal(needs.length, 18);
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
      const functions = ['defineMotion', 'defineValue', 'defineGesture', 'defineSequence', 'animateStyle', 'morph'];
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
      assert.deepEqual(await page.locator('table tbody th').allTextContents(), ['linear() easing', 'view timeline', '@property']);
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

  /** The top app bar's buttons of a compact screen: the Astro dev toolbar has a "Menu" button of its own. */
  const topBarButton = (page, label) => page.locator(`button[aria-label="${label}"][aria-controls="site-drawer"]`);
  const navigationIsLive = page =>
    page.waitForFunction(() => !document.querySelector('astro-island[component-export="Navigation"]')?.hasAttribute('ssr'));

  // Below 600 px (Material's compact window class) there is no rail: a top app bar holds the menu, the section and the
  // search, and the column of the page is the window less 16 px on each side (review 6, M2 and Q2). From 600 px the rail is
  // back, unchanged.
  for (const width of [375, 600, 768, 1280]) {
    test(`${name}: at ${width} px the navigation is ${width < 600 ? 'a top app bar' : 'the rail'}, and the page does not scroll sideways`, async () => {
      const browser = await browserType.launch();
      try {
        const page = await browser.newPage({ viewport: { width, height: 812 } });
        await page.goto(base + '/motion/presence/', { waitUntil: 'load' });
        await navigationIsLive(page);
        await frames(page);
        const layout = await page.evaluate(() => {
          const article = document.querySelector('article');
          const style = getComputedStyle(article);
          return {
            scroll: document.documentElement.scrollWidth,
            rail: document.querySelector('.navigation-rail')?.getBoundingClientRect().width ?? 0,
            column: article.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight),
          };
        });
        assert.ok(layout.scroll <= width, `the page is ${layout.scroll} px wide in a ${width} px window`);
        assert.equal(await topBarButton(page, 'Menu').isVisible(), width < 600, 'the top app bar');
        if (width < 600) {
          assert.equal(layout.rail, 0, 'the rail is shown on a compact screen');
          assert.equal(layout.column, width - 32, 'the column is not the window less 16 px on each side');
          const bar = page.locator('button[aria-controls="site-drawer"]').first().locator('..');
          assert.equal((await bar.textContent()).trim(), 'Animation', 'the top app bar names the section');
        } else {
          assert.ok(layout.rail > 0, 'the rail is hidden');
        }
      } finally { await browser.close(); }
    });
  }

  // The top app bar's Menu and Search open one modal drawer, the Udixio SideSheet: min(320 px, 85vw) wide, over a scrim, the
  // focus held inside while it is open, Escape closes it and gives the focus back to the button that opened it.
  for (const [control, dialog] of [['Menu', 'Site menu'], ['Search', 'Search documentation']]) {
    test(`${name}: at 375 px ${control} opens the modal drawer, which holds the focus and gives it back`, async () => {
      const browser = await browserType.launch();
      try {
        const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
        await page.goto(base + '/motion/presence/', { waitUntil: 'load' });
        await navigationIsLive(page);
        await frames(page);
        const button = topBarButton(page, control);
        assert.equal(await button.getAttribute('aria-expanded'), 'false');
        await button.click();
        const sheet = page.getByRole('dialog', { name: dialog });
        await sheet.waitFor({ state: 'visible' });
        await page.waitForFunction(() => document.getElementById('site-drawer').getAnimations({ subtree: true }).length === 0);
        assert.equal(await button.getAttribute('aria-expanded'), 'true');
        const box = await sheet.boundingBox();
        assert.ok(Math.abs(box.width - Math.min(320, 375 * 0.85)) <= 1, `the drawer is ${box.width} px wide`);
        assert.ok(box.x + box.width <= 375, `the drawer ends at ${box.x + box.width} px`);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth) <= 375, 'the page scrolls sideways');
        if (control === 'Menu') {
          // The four sections, the current one marked, then the pages of the section; the focus starts on the current page.
          const sections = sheet.getByRole('navigation', { name: 'Site sections' });
          assert.equal(await sections.getByRole('link').count(), 4);
          for (const label of ['Start', 'Animation', 'Components', 'Themes']) assert.equal(await sections.getByRole('link', { name: label, exact: true }).count(), 1, `no section named ${label}`);
          assert.equal(await sections.getByRole('link', { name: 'Animation' }).getAttribute('aria-current'), 'page');
          const current = sheet.getByRole('navigation', { name: 'Animation documentation' }).getByRole('link', { name: 'Presence', exact: true });
          assert.equal(await current.getAttribute('aria-current'), 'page');
          assert.equal(await current.evaluate(element => element === document.activeElement), true, 'the focus is not on the current page');
          assert.equal(await sheet.getByRole('switch', { name: 'Reduce motion' }).count(), 1);
          assert.equal(await sheet.getByRole('switch', { name: 'Dark theme' }).count(), 1);
        } else {
          assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('aria-label')), 'Search documentation');
        }
        // The page behind is inert: Tab goes round the drawer, through the browser's own controls (the body, to the page)
        // as with a native modal dialog, and never reaches the page.
        let inside = 0;
        for (let step = 0; step < 60; step++) {
          await page.keyboard.press('Tab');
          const where = await page.evaluate(() => document.getElementById('site-drawer').contains(document.activeElement) ? 'drawer' : document.activeElement === document.body ? 'body' : document.activeElement?.outerHTML.slice(0, 80));
          assert.ok(where === 'drawer' || where === 'body', `Tab ${step + 1} reached the page: ${where}`);
          if (where === 'drawer') inside++;
        }
        assert.ok(inside > 0, 'Tab never reached the drawer');
        await page.keyboard.press('Escape');
        await sheet.waitFor({ state: 'hidden' });
        assert.equal(await button.evaluate(element => element === document.activeElement), true, 'the focus is not back on the button');
        assert.equal(await button.getAttribute('aria-expanded'), 'false');
      } finally { await browser.close(); }
    });
  }

  /** Opens the phone's drawer from the top app bar, and waits until its opening has ended. */
  async function openDrawer(page, control = 'Menu') {
    await topBarButton(page, control).click();
    const sheet = page.getByRole('dialog', { name: control === 'Menu' ? 'Site menu' : 'Search documentation' });
    await sheet.waitFor({ state: 'visible' });
    await page.waitForFunction(() => document.getElementById('site-drawer').getAnimations({ subtree: true }).length === 0);
    return sheet;
  }

  // Review 7, Q4: a touch screen has no Escape key, so the drawer's header shows a close button; it gives the focus back to
  // the top app bar's button that opened the drawer, as Escape does.
  for (const [control, close] of [['Menu', 'Close menu'], ['Search', 'Close search']]) {
    test(`${name}: at 375 px the drawer's header shows "${close}", which closes it and gives the focus back`, async () => {
      const browser = await browserType.launch();
      try {
        const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
        await page.goto(base + '/motion/presence/', { waitUntil: 'load' });
        await navigationIsLive(page);
        await frames(page);
        const sheet = await openDrawer(page, control);
        const button = sheet.getByRole('button', { name: close, exact: true });
        assert.equal(await button.isVisible(), true, 'the close button is hidden');
        const [drawer, box] = [await sheet.boundingBox(), await button.boundingBox()];
        assert.ok(box.y - drawer.y < 64 && drawer.x + drawer.width - (box.x + box.width) < 24, `the close button is not in the header's end: ${JSON.stringify({ drawer, box })}`);
        assert.ok(box.width >= 40 && box.height >= 40, `the close button is ${box.width} × ${box.height} px`);
        await button.click();
        await sheet.waitFor({ state: 'hidden' });
        assert.equal(await topBarButton(page, control).evaluate(element => element === document.activeElement), true, 'the focus is not back on the button');
        // From the keyboard too: Tab reaches the close button, and Enter closes the drawer.
        await openDrawer(page, control);
        await button.focus();
        await page.keyboard.press('Enter');
        await sheet.waitFor({ state: 'hidden' });
        assert.equal(await topBarButton(page, control).evaluate(element => element === document.activeElement), true, 'the focus is not back on the button after Enter');
      } finally { await browser.close(); }
    });
  }

  // Review 7, Q4: the four sections of the site are ONE row of four items, an icon over a short label, so the pages keep the
  // height; at the narrowest phone the labels still do not touch.
  for (const width of [320, 375, 390, 599]) {
    test(`${name}: at ${width} px the drawer's four sections are one row, the current one marked`, async () => {
      const browser = await browserType.launch();
      try {
        const page = await browser.newPage({ viewport: { width, height: 740 } });
        await page.goto(base + '/motion/presence/', { waitUntil: 'load' });
        await navigationIsLive(page);
        await frames(page);
        const sheet = await openDrawer(page);
        const drawer = await sheet.boundingBox();
        assert.ok(Math.abs(drawer.width - Math.min(320, width * 0.85)) <= 1, `the drawer is ${drawer.width} px wide`);
        const items = await sheet.getByRole('navigation', { name: 'Site sections' }).getByRole('link').evaluateAll(links => links.map(link => {
          const label = [...link.querySelectorAll('span')].find(span => span.getAttribute('aria-hidden') === 'false' && span.textContent.trim());
          const box = link.getBoundingClientRect();
          const text = label.getBoundingClientRect();
          return { name: label.textContent.trim(), current: link.getAttribute('aria-current'), top: box.top, bottom: box.bottom, left: box.left, right: box.right, labelLeft: text.left, labelRight: text.right, labelTop: text.top };
        }));
        assert.deepEqual(items.map(item => item.name), ['Start', 'Animation', 'Components', 'Themes']);
        assert.deepEqual(items.map(item => item.current), [null, 'page', null, null]);
        for (const item of items) {
          assert.ok(Math.abs(item.top - items[0].top) <= 1 && Math.abs(item.labelTop - items[0].labelTop) <= 1, `${item.name} is not on the row`);
          assert.ok(item.bottom - item.top <= 72, `${item.name} is ${item.bottom - item.top} px high`);
          assert.ok(item.labelLeft >= drawer.x + 4 && item.labelRight <= drawer.x + drawer.width - 4, `${item.name}'s label leaves the drawer`);
        }
        for (let index = 1; index < items.length; index++) {
          const gap = items[index].labelLeft - items[index - 1].labelRight;
          assert.ok(gap >= 8, `${items[index - 1].name} and ${items[index].name} are ${gap} px apart`);
        }
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth) <= width, 'the page scrolls sideways');
      } finally { await browser.close(); }
    });
  }

  // Review 7, Q4: on a page at the bottom of the menu, the drawer opens on it: the list is scrolled so that the current page
  // is in view, neither under the header nor under the switches of the footer, and the focus is on it.
  test(`${name}: at 375 px the drawer opens scrolled to the current page`, async () => {
    const last = MOTION_SECTIONS.at(-1).pages.at(-1);
    const browser = await browserType.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 375, height: 667 } });
      await page.goto(base + last.href + '/', { waitUntil: 'load' });
      await navigationIsLive(page);
      await frames(page);
      const sheet = await openDrawer(page);
      const current = sheet.getByRole('navigation', { name: 'Animation documentation' }).getByRole('link', { name: last.label, exact: true });
      assert.equal(await current.getAttribute('aria-current'), 'page');
      const place = await current.evaluate(link => {
        let list = link.parentElement;
        while (list && getComputedStyle(list).overflowY !== 'auto') list = list.parentElement;
        const view = list.getBoundingClientRect();
        const box = link.getBoundingClientRect();
        const footer = document.querySelector('#site-drawer [role="switch"]').getBoundingClientRect();
        const background = getComputedStyle(link).backgroundColor;
        const other = getComputedStyle(link.closest('nav').querySelector('a:not([aria-current])')).backgroundColor;
        return { top: box.top, bottom: box.bottom, viewTop: view.top, viewBottom: view.bottom, footerTop: footer.top, scrolled: list.scrollTop, focused: link === document.activeElement, background, other };
      });
      // The current page is marked to the eye too, not only by aria-current.
      assert.notEqual(place.background, place.other, 'the current page looks like the others');
      assert.ok(place.scrolled > 0, 'the list is not scrolled');
      assert.ok(place.top >= place.viewTop && place.bottom <= place.viewBottom, `the current page is out of the list's view: ${JSON.stringify(place)}`);
      assert.ok(place.bottom <= place.footerTop, `the current page is under the footer: ${JSON.stringify(place)}`);
      assert.equal(place.focused, true, 'the focus is not on the current page');
    } finally { await browser.close(); }
  });

  test(`${name}: at 375 px a link of the drawer navigates, and the drawer opens again on the new page`, async () => {
    const browser = await browserType.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
      await page.goto(base + '/motion/presence/', { waitUntil: 'load' });
      await navigationIsLive(page);
      await frames(page);
      await topBarButton(page, 'Menu').click();
      await page.getByRole('dialog', { name: 'Site menu' }).getByRole('link', { name: 'Lists', exact: true }).click();
      await page.waitForFunction(() => location.pathname.startsWith('/motion/lists'));
      await page.waitForLoadState('networkidle');
      // The new page is not held inert, nor its scroll locked.
      assert.deepEqual(await page.evaluate(() => [...document.body.children].filter(child => child.inert && !child.contains(document.getElementById('site-drawer')) && !child.matches('[aria-hidden="true"]')).length), 0);
      assert.equal(await page.evaluate(() => document.body.style.overflow), '');
      await topBarButton(page, 'Menu').click();
      const sheet = page.getByRole('dialog', { name: 'Site menu' });
      await sheet.waitFor({ state: 'visible' });
      assert.equal(await sheet.getByRole('link', { name: 'Lists', exact: true }).getAttribute('aria-current'), 'page');
    } finally { await browser.close(); }
  });

  // From 600 px the rail's menu button extends the rail: it says so with aria-expanded, and names the rail it extends.
  test(`${name}: at 768 px the rail's menu button tells whether the rail is extended`, async () => {
    const browser = await browserType.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 768, height: 812 } });
      await page.goto(base + '/motion/presence/', { waitUntil: 'load' });
      await navigationIsLive(page);
      await page.waitForSelector('#site-rail button[aria-controls="site-rail"]');
      const button = page.locator('#site-rail button[aria-label="Menu"]');
      assert.equal(await button.getAttribute('aria-controls'), 'site-rail');
      assert.equal(await button.getAttribute('aria-expanded'), 'false');
      await button.click();
      await page.waitForFunction(() => document.querySelector('#site-rail button[aria-label="Menu"]').getAttribute('aria-expanded') === 'true');
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth) <= 768, 'the page scrolls sideways');
    } finally { await browser.close(); }
  });

  // Y4: a skip link is the first stop of the keyboard, shown when focused, and every navigation landmark has a name.
  test(`${name}: a skip link leads to the content, and every nav has a name`, async () => {
    const browser = await browserType.launch();
    try {
      for (const width of [375, 1280]) {
        const page = await browser.newPage({ viewport: { width, height: 812 } });
        await page.goto(base + '/motion/presence/', { waitUntil: 'load' });
        await navigationIsLive(page);
        await page.keyboard.press('Tab');
        const skip = page.getByRole('link', { name: 'Skip to content' });
        assert.equal(await skip.evaluate(element => element === document.activeElement), true, `${width}: the first Tab is not the skip link`);
        const box = await skip.boundingBox();
        assert.ok(box.width > 40 && box.height > 30, `${width}: the focused skip link is not shown`);
        await page.keyboard.press('Enter');
        await page.waitForFunction(() => document.activeElement?.id === 'doc-content');
        assert.equal(await page.evaluate(() => document.activeElement.tagName), 'MAIN');
        if (width < 600) await topBarButton(page, 'Menu').click();
        const unnamed = await page.evaluate(() => [...document.querySelectorAll('nav')].filter(nav => !nav.getAttribute('aria-label') && !nav.getAttribute('aria-labelledby')).length);
        assert.equal(unnamed, 0, `${width}: a nav has no name`);
        await page.close();
      }
    } finally { await browser.close(); }
  });

  // M2: a code block is never cut on the right at 375 px. It keeps the site's style (16 px on 28 px lines, long lines wrap),
  // and a word longer than the column breaks inside it.
  for (const path of ['/motion/presence/', '/motion/lists/', '/motion/getting-started/']) {
    test(`${name}: at 375 px no code block of ${path} is cut on the right`, async () => {
      const browser = await browserType.launch();
      try {
        const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
        await page.goto(base + path, { waitUntil: 'load' });
        await page.waitForLoadState('networkidle');
        const blocks = await page.evaluate(() => [...document.querySelectorAll('.card-code pre')]
          .filter(pre => pre.getClientRects().length > 0)
          .map(pre => ({ scroll: pre.scrollWidth, client: pre.clientWidth, font: getComputedStyle(pre).fontSize, line: getComputedStyle(pre).lineHeight })));
        assert.ok(blocks.length > 0, 'no code block is shown');
        for (const block of blocks) {
          assert.ok(block.scroll <= block.client, `a code block is ${block.scroll} px wide in ${block.client} px`);
          assert.deepEqual([block.font, block.line], ['16px', '28px'], 'a code block left the site\'s code style');
        }
      } finally { await browser.close(); }
    });
  }

  // M2: below 600 px each option is a card (its name, its values and default, what it does), from 600 px a table row.
  test(`${name}: the options are cards below 600 px and a table from 600 px`, async () => {
    const browser = await browserType.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
      await page.goto(base + '/motion/presence/', { waitUntil: 'load' });
      const rows = await page.locator('table:has(caption)').first().locator('tbody tr').count();
      const cards = page.getByRole('list', { name: 'Options and their defaults' }).first();
      assert.equal(await page.locator('table:has(caption)').first().isVisible(), false, 'the table is shown at 375 px');
      assert.equal(await cards.isVisible(), true, 'the cards are hidden at 375 px');
      assert.equal(await cards.getByRole('listitem').count(), rows);
      const card = await cards.getByRole('listitem').first().boundingBox();
      assert.ok(card.width <= 343, `a card is ${card.width} px wide`);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth) <= 375, 'the page scrolls sideways');
      await page.setViewportSize({ width: 768, height: 812 });
      assert.equal(await page.locator('table:has(caption)').first().isVisible(), true, 'the table is hidden at 768 px');
      assert.equal(await cards.isVisible(), false, 'the cards are shown at 768 px');
    } finally { await browser.close(); }
  });

  // M2: on a phone the install command wraps; its "$" stays at the start of the first line.
  test(`${name}: at 375 px the install command keeps its "$" on its first line`, async () => {
    const browser = await browserType.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
      await page.goto(base + '/motion/', { waitUntil: 'load' });
      const group = page.locator('[data-copy-group]').first();
      const [prompt, command] = await Promise.all([
        group.locator('span[aria-hidden="true"]').first().boundingBox(),
        group.locator('[data-copy-source]:not([hidden])').boundingBox(),
      ]);
      assert.ok(command.height > 40, 'the command does not wrap at 375 px: the test no longer checks anything');
      assert.ok(Math.abs(prompt.y - command.y) <= 1, `the "$" is at ${prompt.y} px, the command's first line at ${command.y} px`);
    } finally { await browser.close(); }
  });

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

  // Review 6, minors: the sentence beside the tiles' Pause button follows the reduced-motion policy, as the button does.
  test(`${name}: the components section says its tiles play by themselves, or that they rest under reduced motion`, async () => {
    const browser = await browserType.launch();
    try {
      for (const [reducedMotion, says, not] of [
        ['no-preference', 'Each one below plays by itself; point at it to take over.', 'rests until you use it'],
        ['reduce', 'Each one below rests until you use it.', 'plays by itself'],
      ]) {
        const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion });
        await page.goto(base + '/motion/', { waitUntil: 'load' });
        const text = (await page.locator('[data-components-showcase] p').first().innerText()).replace(/\s+/g, ' ');
        assert.ok(text.includes(says), `${reducedMotion}: the section says "${text}"`);
        assert.ok(!text.includes(not), `${reducedMotion}: the section still says "${not}"`);
        await page.close();
      }
    } finally { await browser.close(); }
  });

  // Review 6, minors: the tooltips of the rail's last buttons open beside the rail, inside the window (below them, the
  // theme button's tooltip was cut by the bottom of the window).
  test(`${name}: the tooltips of the rail's Reduce motion and theme buttons open to their right, inside the window`, async () => {
    const browser = await browserType.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
      await page.goto(base + '/motion/presence/', { waitUntil: 'load' });
      await page.waitForFunction(() => !document.querySelector('astro-island[component-export="Navigation"]')?.hasAttribute('ssr'));
      await page.waitForLoadState('networkidle');
      await frames(page);
      for (const label of [/^Switch to (light|dark) mode$/, /^Reduce motion$/]) {
        const button = page.getByRole('button', { name: label });
        await page.mouse.move(640, 360);
        await button.hover();
        const tooltip = page.getByRole('tooltip', { name: label });
        await tooltip.waitFor({ state: 'visible' });
        await page.waitForTimeout(400);
        const [box, tip] = [await button.boundingBox(), await tooltip.boundingBox()];
        assert.ok(tip.x >= box.x + box.width, `the tooltip "${label}" is not to the right of its button`);
        assert.ok(tip.y >= 0 && tip.y + tip.height <= 720, `the tooltip "${label}" leaves the window: ${tip.y} to ${tip.y + tip.height}`);
      }
    } finally { await browser.close(); }
  });

  // Review 6, minors: the options of a cascade and of a split text belong to Lists and Text; the presence table leaves them out.
  test(`${name}: the presence options leave out stagger, origin and split, and link Lists and Text`, async () => {
    const browser = await browserType.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      await page.goto(base + '/motion/presence/', { waitUntil: 'load' });
      const rows = (await page.locator('table:has(caption)').last().locator('tbody th').allTextContents()).map(row => row.trim());
      assert.deepEqual(rows, ['timing', 'reduced', 'exit']);
      const lead = page.locator('#options + p');
      assert.equal(await lead.getByRole('link', { name: 'Lists' }).getAttribute('href'), '/motion/lists#options');
      assert.equal(await lead.getByRole('link', { name: 'Text' }).getAttribute('href'), '/motion/text#options');
    } finally { await browser.close(); }
  });

  // Review 6, Y5: a loop restarts from its first keyframe, so each beat of the equalizer goes up and comes back down.
  test(`${name}: each bar of the loop's equalizer goes up and back down, ending on its first keyframe`, async () => {
    const browser = await browserType.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      await page.goto(base + '/motion/loop/', { waitUntil: 'load' });
      const demo = '[data-example-panel][data-framework="react"][data-view="preview"]';
      await bringScene(page, demo, `${demo} span.origin-bottom`);
      await page.waitForFunction(selector => [...document.querySelectorAll(selector)].every(el => el.getAnimations().length > 0), `${demo} span.origin-bottom`);
      const beats = await page.evaluate(selector => [...document.querySelectorAll(selector)].map(el => {
        const frames = el.getAnimations()[0].effect.getKeyframes();
        return { count: frames.length, first: frames[0].transform, last: frames.at(-1).transform };
      }), `${demo} span.origin-bottom`);
      assert.equal(beats.length, 3);
      for (const beat of beats) {
        assert.equal(beat.count, 3, 'a beat has not three keyframes');
        assert.equal(beat.last, beat.first, 'a beat does not end on its first keyframe');
      }
    } finally { await browser.close(); }
  });
}

// Review 6, Y3: the related cards and the root page show these sentences in every framework, so none names the syntax of one.
test('every summary of the Animation section is framework-neutral', () => {
  const syntax = /data-motion|hidden attribute|<\w+>|useMotion|udxMotion|\b\w+\(\)|Tailwind class|client router/;
  for (const need of MOTION_NEEDS) assert.doesNotMatch(need.summary, syntax, `${need.slug || 'overview'}: ${need.summary}`);
});
