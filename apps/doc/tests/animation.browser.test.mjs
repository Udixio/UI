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

  test(`${name}: the facts print the measured weights of @udixio/motion and the oldest supported browsers`, async () => {
    const browser = await browserType.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      await page.goto(base + '/motion/', { waitUntil: 'load' });
      // The weights are measured (packages/motion/size-report.json), gzipped, printed in kB with one decimal.
      const report = JSON.parse(await readFile(new URL('../../../packages/motion/size-report.json', import.meta.url), 'utf8'));
      const kb = bytes => `${Number((bytes / 1000).toFixed(1))} kB`;
      assert.equal((await page.locator('.fact-figure').first().textContent()).trim(), kb(report.entries.core));
      // The root page holds the core row, the adapters on one line and one line about the others; the full table is on
      // Getting started.
      const weightRows = () => page.locator('.weight').evaluateAll(all => all.map(row => [row.querySelector('.weight-path').textContent.trim(), row.querySelector('.weight-kb').firstChild.textContent.trim()]));
      assert.deepEqual(await weightRows(), [['@udixio/motion', kb(report.entries.core)]]);
      const others = Object.entries(report.entries).filter(([entryName]) => entryName !== 'core');
      const [largestName, largestBytes] = others.reduce((largest, other) => (other[1] > largest[1] ? other : largest));
      const more = (await page.locator('.weights-more').textContent()).replace(/\s+/g, ' ').trim();
      assert.match(more, new RegExp(`^${others.length} more import paths load on first use or when you import them\\. The largest, ${largestName}, is ${kb(largestBytes).replace('.', '\\.')} gzipped\\.`));
      assert.equal(await page.locator('.weights-link').getAttribute('href'), '/motion/getting-started#weight');
      // The oldest browser of each engine, and the features the package falls back from.
      const browsers = await page.locator('[aria-label="Oldest supported browsers"] > li > span:first-child').evaluateAll(all => all.map(each => each.textContent.replace(/\s+/g, ' ').trim()));
      assert.deepEqual(browsers.map(text => text.split(' · ')[0]), ['Chrome 109+', 'Firefox 153+', 'Safari 26.6+', 'iOS Safari 18.5+']);
      assert.deepEqual(await page.locator('.motion-page table tbody th').allTextContents(), ['linear() easing', 'View Transitions', 'view timeline', '@property']);
      await page.goto(base + '/motion/getting-started#weight', { waitUntil: 'load' });
      const byPath = Object.fromEntries(await weightRows());
      assert.equal(byPath['/layout'], kb(report.entries.layout));
      assert.equal(byPath['/svg'], kb(report.entries.svg));
      assert.equal(byPath['@udixio/ui-react'], kb(report.adapters.react));
      assert.equal(Object.keys(byPath).length, Object.keys(report.entries).length + Object.keys(report.adapters).length, 'the full table lists every measured entry and every adapter');
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

  test(`${name}: at 1280 px a usage block of a need page shows its framework tabs, its view switch and its copy button on one row`, async () => {
    const browser = await browserType.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      await page.goto(base + '/motion/lists/', { waitUntil: 'load' });
      // The live usage block: the page's first one is code only.
      const usage = page.locator('.motion-usage:has([data-view="preview"])').first();
      // The framework tabs remount once when they sync with the stored choice: measure after that.
      await page.waitForFunction(() => !document.querySelector('.motion-usage [data-code-ssr]'));
      const tabs = usage.getByRole('tablist', { name: 'Example framework', exact: true });
      assert.equal(await tabs.isVisible(), true, 'the usage block shows no framework tabs at 1280 px');
      assert.equal(await tabs.evaluate(element => element.classList.contains('code-framework-pills')), true);
      assert.deepEqual(await tabs.getByRole('tab').allTextContents(), ['HTML', 'React', 'Angular', 'Svelte']);
      assert.equal(await usage.locator('select').count(), 0, 'the usage block still has a select');
      // The toolbar's controls are islands: wait until each has rendered before measuring it.
      const middle = async locator => { await locator.waitFor({ state: 'visible' }); const box = await locator.boundingBox(); return box.y + box.height / 2; };
      const row = await middle(tabs);
      for (const control of [
        usage.getByRole('group', { name: 'Example view', exact: true }),
        usage.getByRole('button', { name: 'Copy React code to clipboard', exact: true }),
      ]) {
        assert.ok(Math.abs((await middle(control)) - row) < 2, 'a control of the toolbar is not on the row of the tabs');
      }
    } finally { await browser.close(); }
  });

  test(`${name}: below 560 px a usage block keeps its framework tabs, scrolling, with its buttons above them, and the choice is kept`, async () => {
    const browser = await browserType.launch();
    try {
      const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
      const page = await context.newPage();
      const hydrated = () => page.waitForFunction(() => document.querySelectorAll('.motion-usage [data-code-ssr]').length === 0);
      await page.goto(base + '/motion/lists/', { waitUntil: 'load' });
      await hydrated();
      // The live usage block: the page's first one is code only.
      const usage = page.locator('.motion-usage:has([data-view="preview"])').first();
      const tabs = usage.getByRole('tablist', { name: 'Example framework', exact: true });
      assert.equal(await tabs.isVisible(), true, 'the framework tabs are hidden at 375 px');
      assert.equal(await usage.locator('select').count(), 0, 'the usage block still has a select');
      // The tabs scroll inside the card; the page itself does not scroll sideways.
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth) <= 375, 'the page scrolls sideways at 375 px');
      // The view switch and the copy button wrap above the tabs, which stay on the toolbar's edge.
      const copy = usage.getByRole('button', { name: 'Copy React code to clipboard', exact: true });
      assert.equal(await copy.isVisible(), true);
      const [tabsBox, copyBox] = [await tabs.boundingBox(), await copy.boundingBox()];
      assert.ok(copyBox.y + copyBox.height <= tabsBox.y + 1, 'the buttons are not above the tabs at 375 px');
      await tabs.getByRole('tab', { name: 'Angular', exact: true }).click();
      const visible = () => usage.locator('[data-example-panel]:not([hidden])').evaluateAll(panels => panels.map(panel => `${panel.dataset.framework}/${panel.dataset.view}`));
      // The Preview view is the one shown: one panel, the Angular preview.
      await page.waitForFunction(() => document.querySelector('.motion-usage [data-example-panel][data-framework="angular"][data-view="preview"]:not([hidden])') !== null);
      assert.deepEqual(await visible(), ['angular/preview']);
      await page.reload({ waitUntil: 'load' });
      // The head script selects the stored tab before the first paint, and the island keeps it once it has hydrated.
      assert.equal(await tabs.getByRole('tab', { name: 'Angular', exact: true }).getAttribute('aria-selected'), 'true');
      await hydrated();
      assert.equal(await tabs.getByRole('tab', { name: 'Angular', exact: true }).getAttribute('aria-selected'), 'true');
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
      // The ruler is a Udixio Slider: the visitor seeks it with the keyboard (Home: start, ArrowRight: 1 ‰, End: end).
      const ruler = page.locator('[data-launch-ruler]');
      await ruler.focus();
      const opacity = () => page.evaluate(selector => getComputedStyle(document.querySelector(selector)).opacity, title);
      await page.keyboard.press('Home');
      for (let i = 0; i < 100; i += 1) await page.keyboard.press('ArrowRight');
      await frames(page);
      const early = Number(await opacity());
      assert.ok(early < 1, `the title is at opacity ${early} at 10 %, expected below 1`);
      await page.keyboard.press('End');
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
      const link = page.getByRole('navigation', { name: 'Animation documentation' }).getByRole('link', { name: 'Lists', exact: true });
      assert.equal(await link.getAttribute('aria-current'), 'page');
    } finally { await browser.close(); }
  });
}
