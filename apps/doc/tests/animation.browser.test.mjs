// Run against a built site: MOTION_BROWSERS=chromium,firefox,webkit MOTION_DOC_URL=http://localhost:4322 node --test tests/animation.browser.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
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

  test(`${name}: the root page lists every need, with one tile and one link to its page`, async () => {
    const browser = await browserType.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      await page.goto(base + '/motion/', { waitUntil: 'load' });
      await page.getByRole('heading', { level: 1, name: 'Animation' }).waitFor();
      const sections = await page.locator('h2').allTextContents();
      assert.deepEqual(sections.map(text => text.trim()), ['Appear & leave', 'Move', 'Follow the scroll', 'Respond & tell', 'Fine-tune']);
      const needs = MOTION_NEEDS.filter(need => need.scene);
      assert.equal(needs.length, 20);
      const tiles = await page.locator('article[id^="need-"]').evaluateAll(articles => articles.map(article => ({
        id: article.id,
        links: [...article.querySelectorAll('a')].map(link => link.getAttribute('href')),
      })));
      assert.equal(tiles.length, 20);
      for (const need of needs) {
        const tile = tiles.find(each => each.id === `need-${need.slug}`);
        assert.ok(tile, `no tile for ${need.slug}`);
        assert.ok(tile.links.includes(need.href), `the tile of ${need.slug} does not link to ${need.href}`);
      }
    } finally { await browser.close(); }
  });

  test(`${name}: the root page is calm: nothing runs one second after load, and no task blocks it`, async () => {
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
    } finally { await browser.close(); }
  });

  test(`${name}: choosing a framework in one tile shows it in every tile, and it survives a reload`, async () => {
    const browser = await browserType.launch();
    try {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const page = await context.newPage();
      await page.goto(base + '/motion/', { waitUntil: 'load' });
      const selected = () => page.locator('[data-code-tabs] [role="tab"][aria-selected="true"]').evaluateAll(tabs => tabs.map(tab => tab.textContent.trim()));
      assert.equal((await selected()).filter(text => text === 'React').length, 20);
      await page.locator('#need-lists').getByRole('tab', { name: 'Angular', exact: true }).click();
      assert.deepEqual([...new Set(await selected())], ['Angular']);
      await page.locator('#need-lists').getByRole('tab', { name: 'React', exact: true }).click();
      assert.deepEqual([...new Set(await selected())], ['React']);
      await page.reload({ waitUntil: 'load' });
      assert.deepEqual([...new Set(await selected())], ['React']);
      // The choice is kept by the reload: and the snippet shown is the React one of its tile.
      const shown = await page.locator('#need-lists [role="tabpanel"]:not([hidden])').textContent();
      assert.match(shown, /defineMotion\('inbox'/);
    } finally { await browser.close(); }
  });

  test(`${name}: the arrow keys move between the code tabs of a tile`, async () => {
    const browser = await browserType.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      await page.goto(base + '/motion/', { waitUntil: 'load' });
      const tabs = page.locator('#need-lists').getByRole('tab');
      await page.locator('#need-lists').getByRole('tab', { name: 'React', exact: true }).focus();
      await page.keyboard.press('ArrowRight');
      assert.equal(await tabs.nth(2).evaluate(el => el === document.activeElement), true, 'Angular does not have the focus');
      assert.equal(await tabs.nth(2).getAttribute('aria-selected'), 'true');
      await page.keyboard.press('End');
      assert.equal(await tabs.nth(3).evaluate(el => el === document.activeElement), true, 'Svelte does not have the focus');
      await page.keyboard.press('Home');
      assert.equal(await tabs.nth(0).evaluate(el => el === document.activeElement), true, 'HTML does not have the focus');
      await page.keyboard.press('ArrowLeft');
      assert.equal(await tabs.nth(3).evaluate(el => el === document.activeElement), true, 'ArrowLeft does not wrap to Svelte');
    } finally { await browser.close(); }
  });

  test(`${name}: the section bar marks the section in view, and its pill travels with it`, async () => {
    const browser = await browserType.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      await page.goto(base + '/motion/', { waitUntil: 'load' });
      // The section sits at about a third of the view: the observer's band is between 30 % and 40 % of the height.
      await page.evaluate(() => {
        const top = document.getElementById('tell').getBoundingClientRect().top + window.scrollY;
        window.scrollTo(0, top - window.innerHeight * 0.35);
      });
      await page.waitForFunction(() => document.querySelector('[data-section-link="tell"]')?.getAttribute('aria-current') === 'true');
      const bar = await page.evaluate(() => {
        const links = [...document.querySelectorAll('[data-section-link]')];
        return {
          current: links.filter(link => link.getAttribute('aria-current') === 'true').map(link => link.dataset.sectionLink),
          visiblePills: links.map(link => link.querySelector('.bar-pill')?.hidden === false ? link.dataset.sectionLink : null).filter(Boolean),
        };
      });
      assert.deepEqual(bar.current, ['tell']);
      assert.deepEqual(bar.visiblePills, ['tell']);
    } finally { await browser.close(); }
  });

  test(`${name}: Add three in the lists tile cascades in, and a Delete removes the focused item`, async () => {
    const browser = await browserType.launch();
    try {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'no-preference' });
      const page = await context.newPage();
      const pageErrors = [];
      page.on('pageerror', error => pageErrors.push(error.message));
      await page.goto(base + '/motion/', { waitUntil: 'load' });
      const tile = page.locator('#need-lists');
      await bringScene(page, '#need-lists [data-motion-scene="inbox"]', '#need-lists [data-inbox-list] > li');
      const items = '#need-lists [data-inbox-list] > li';
      const count = () => page.locator(items).count();
      const waitForRest = () => page.waitForFunction(() => [...document.querySelectorAll('#need-lists [data-inbox-list] *')].every(el => el.getAnimations().length === 0));
      const before = await count();
      await tile.getByRole('button', { name: 'Center', exact: true }).click();
      // The inline transform starts within 100 ms of the click, and the click is read in the same task.
      // The inline transform is the individual transform properties the runtime writes while a motion is in flight.
      const started = await page.evaluate(async () => {
        const begin = performance.now();
        const transformed = el => el.style.transform !== '' || el.style.translate !== '' || el.style.scale !== '';
        document.querySelector('#need-lists [data-inbox-add="3"]').click();
        while (performance.now() - begin < 100) {
          if ([...document.querySelectorAll('#need-lists [data-inbox-list] > li')].some(transformed)) return performance.now() - begin;
          await new Promise(resolve => requestAnimationFrame(resolve));
        }
        return null;
      });
      assert.ok(started !== null, 'no item has an inline transform within 100 ms of Add three');
      await waitForRest();
      assert.equal(await count(), before, 'the list did not keep its five rows');
      const inline = await page.evaluate(() => [...document.querySelectorAll('#need-lists [data-inbox-list] > li')]
        .filter(el => el.style.transform !== '' || el.style.translate !== '' || el.style.scale !== '').length);
      assert.equal(inline, 0, 'an item keeps an inline transform at rest');
      await page.locator(items).first().focus();
      await page.keyboard.press('Delete');
      await page.waitForFunction(([selector, expected]) => document.querySelectorAll(selector).length === expected, [items, before - 1]);
      await waitForRest();
      assert.deepEqual(pageErrors, []);
    } finally { await browser.close(); }
  });

  test(`${name}: reduced motion: Add three leaves no inline transform after a frame, and the loop tile does not play`, async () => {
    const browser = await browserType.launch();
    try {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      await page.goto(base + '/motion/', { waitUntil: 'load' });
      await bringScene(page, '#need-lists [data-motion-scene="inbox"]', '#need-lists [data-inbox-list] > li');
      await page.evaluate(() => document.querySelector('#need-lists [data-inbox-add="3"]').click());
      await frames(page);
      const transformed = await page.evaluate(() => [...document.querySelectorAll('#need-lists [data-inbox-list] > li')]
        .filter(el => el.style.transform !== '' || el.style.translate !== '' || el.style.scale !== '').length);
      assert.equal(transformed, 0, 'an item moves under reduced motion');
      await page.waitForFunction(() => [...document.querySelectorAll('#need-lists [data-inbox-list] *')].every(el => el.getAnimations().length === 0));

      await bringScene(page, '#need-loop [data-motion-scene="loop"]', '#need-loop [data-loop-pausable]');
      const running = await page.evaluate(() => [...document.querySelectorAll('#need-loop [data-loop-pausable]')]
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
