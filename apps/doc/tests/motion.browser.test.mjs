// Run against a built site: MOTION_BROWSERS=chromium,firefox,webkit MOTION_DOC_URL=http://localhost:4322 node --test tests/motion.browser.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium, firefox, webkit } from 'playwright';

const base = process.env.MOTION_DOC_URL ?? 'http://localhost:4322';
const browserTypes = { chromium, firefox, webkit };
const browsers = (process.env.MOTION_BROWSERS ?? 'chromium').split(',').map(name => name.trim());
for (const name of browsers) {
  if (!Object.hasOwn(browserTypes, name)) throw new Error(`Unknown MOTION_BROWSERS entry: ${name}`);
  const browserType = browserTypes[name];
test(`${name}: Motion works without JavaScript and applies reduced-motion policy`, async () => {
  const browser = await browserType.launch();
  try {
    const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    for (const path of ['/motion/', '/motion/roadmap/', '/motion/tokens/', '/motion/accessibility/', '/motion/demo/', '/animations/']) {
      assert.equal((await page.goto(base + path)).status(), 200, path);
    }
    await page.goto(base + '/motion/');
    const navigation = page.getByRole('navigation', { name: 'Motion documentation' });
    const overview = navigation.getByRole('link', { name: 'Overview' });
    await overview.focus();
    await page.keyboard.press('Tab');
    assert.equal(await navigation.getByRole('link', { name: 'Roadmap' }).evaluate(el => el === document.activeElement), true);
    await Promise.all([page.waitForURL('**/motion/roadmap/'), page.keyboard.press('Enter')]);
    assert.match(page.url(), /\/motion\/roadmap\/?$/);
    await page.goto(base + '/motion/accessibility/');
    const toggle = page.getByLabel('Change the decorative swatch');
    const reduce = page.getByLabel('Reduce motion in this demonstration');
    const swatch = page.locator('.swatch');
    await toggle.focus(); await page.keyboard.press('Space');
    assert.equal(await toggle.isChecked(), true);
    const deadline = Date.now() + 5000;
    let opacity;
    do {
      opacity = await swatch.evaluate(el => getComputedStyle(el).opacity);
      if (opacity === '1') break;
      await new Promise(resolve => setTimeout(resolve, 50));
    } while (Date.now() < deadline);
    assert.equal(opacity, '1');
    await reduce.focus(); await page.keyboard.press('Space');
    assert.equal(await reduce.isChecked(), true);
    assert.equal(await swatch.evaluate(el => getComputedStyle(el).transitionDuration), '0s');
    await toggle.focus(); await page.keyboard.press('Space');
    assert.equal(await toggle.isChecked(), false);
    assert.equal(await swatch.evaluate(el => getComputedStyle(el).opacity), '0.35');
    for (const [policy, expected] of [['reduce', '0'], ['auto', '1'], ['unknown', '1'], ['', '1']]) {
      await page.evaluate(value => value ? document.documentElement.setAttribute('data-motion-policy', value) : document.documentElement.removeAttribute('data-motion-policy'), policy);
      assert.equal(await swatch.evaluate(el => getComputedStyle(el).getPropertyValue('--udx-motion-scale').trim()), expected);
    }
    await page.evaluate(() => document.documentElement.setAttribute('data-motion-policy', 'reduce'));
    const shadow = await page.evaluate(() => {
      const host = document.createElement('div');
      document.body.append(host);
      const span = document.createElement('span');
      host.attachShadow({ mode: 'open' }).append(span);
      const inherited = getComputedStyle(span).getPropertyValue('--udx-motion-scale').trim();
      host.style.setProperty('--udx-motion-scale', '1');
      return { inherited, overridden: getComputedStyle(span).getPropertyValue('--udx-motion-scale').trim() };
    });
    assert.deepEqual(shadow, { inherited: '0', overridden: '1' });
    const blank = await context.newPage();
    await blank.setContent('<html data-motion-policy="reduce"><body></body></html>');
    assert.equal(await blank.evaluate(() => {
      const host = document.createElement('div');
      document.body.append(host);
      const span = document.createElement('span');
      host.attachShadow({ mode: 'open' }).append(span);
      return getComputedStyle(span).getPropertyValue('--udx-motion-scale').trim();
    }), '');
    await blank.close();
    await page.evaluate(() => document.documentElement.removeAttribute('data-motion-policy'));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(await swatch.evaluate(el => getComputedStyle(el).getPropertyValue('--udx-motion-scale').trim()), '0');
  } finally { await browser.close(); }
});

test(`${name}: Motion rail stays selected for both section and legacy URL`, async () => {
  const browser = await browserType.launch();
  try {
    const page = await browser.newPage();
    await page.goto(base + '/motion/');
    await page.getByRole('navigation', { name: 'Motion documentation' }).getByRole('link', { name: 'Roadmap' }).click();
    await page.waitForFunction(() => location.pathname.startsWith('/motion/roadmap'));
    await page.waitForFunction(() => document.title.toLowerCase().includes('roadmap'));
    assert.match(await page.title(), /roadmap/i);
    const rail = page.locator('a.navigation-rail-item[href="/motion"]');
    await page.waitForFunction(() => document.querySelector('a[href="/motion"][aria-current="page"]') !== null);
    assert.equal(await rail.getAttribute('aria-current'), 'page');
    await page.getByRole('navigation', { name: 'Motion documentation' }).getByRole('link', { name: 'Existing animations' }).click();
    await page.waitForFunction(() => location.pathname.startsWith('/animations'));
    await page.waitForFunction(() => document.title.startsWith('Animations'));
    await page.waitForFunction(() => document.querySelector('a[href="/motion"][aria-current="page"]') !== null);
    assert.equal(await rail.getAttribute('aria-current'), 'page');
    await rail.evaluate(el => el.setAttribute('data-test-persisted', 'yes'));
    await page.getByRole('link', { name: 'Get started', exact: true }).click();
    await page.waitForFunction(() => location.pathname.startsWith('/get-started/introduction'));
    await page.waitForFunction(() => document.querySelector('a[href="/motion"][aria-current="page"]') === null);
    assert.equal(await rail.getAttribute('data-test-persisted'), 'yes');
    assert.notEqual(await rail.getAttribute('aria-current'), 'page');
    await rail.click();
    await page.waitForFunction(() => location.pathname === '/motion' || location.pathname === '/motion/');
    await page.waitForFunction(() => document.querySelector('a[href="/motion"][aria-current="page"]') !== null);
    assert.equal(await rail.getAttribute('data-test-persisted'), 'yes');
    assert.equal(await rail.getAttribute('aria-current'), 'page');
    for (const path of ['/motion/', '/motion/roadmap/', '/animations/']) {
      await page.goto(base + path);
      await page.waitForSelector('a[aria-current="page"]');
      assert.equal(await page.getByRole('link', { name: 'Motion', exact: true }).getAttribute('aria-current'), 'page', path);
    }
  } finally { await browser.close(); }
});

test(`${name}: the data-motion demo hides and shows its cards`, async () => {
  const browser = await browserType.launch();
  try {
    const context = await browser.newContext({ reducedMotion: 'no-preference' });
    const page = await context.newPage();
    const pageErrors = [];
    const motionErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error' && message.text().includes('@udixio/motion')) motionErrors.push(message.text());
    });
    await page.goto(base + '/motion/demo/');
    await page.waitForFunction(() => document.querySelector('[data-motion="fade"]')?.getAttribute('data-presence') === 'present');
    await page.getByRole('button', { name: 'Hide cards' }).click();
    const hiding = await page.evaluate(() => {
      const card = document.querySelector('[data-motion="fade"]');
      return { hidden: card.hasAttribute('hidden'), inert: card.hasAttribute('inert'), display: getComputedStyle(card).display };
    });
    assert.equal(hiding.hidden, true);
    assert.equal(hiding.inert, true);
    assert.notEqual(hiding.display, 'none');
    await page.waitForFunction(() => getComputedStyle(document.querySelector('[data-motion="fade"]')).display === 'none');
    assert.equal(await page.locator('[data-motion="fade"]').evaluate(el => el.hasAttribute('hidden')), true);
    await page.getByRole('button', { name: 'Show cards' }).click();
    await page.waitForFunction(() => {
      const card = document.querySelector('[data-motion="fade"]');
      return card.getAttribute('data-presence') === 'present' && !card.hasAttribute('inert');
    });
    const shown = await page.locator('[data-motion="fade"]').evaluate(el => ({ hidden: el.hasAttribute('hidden'), opacity: getComputedStyle(el).opacity }));
    assert.equal(shown.hidden, false);
    assert.equal(shown.opacity, '1');
    const reduce = page.getByLabel('Reduce motion on this page');
    await reduce.check();
    assert.equal(await page.evaluate(() => document.documentElement.getAttribute('data-motion-policy')), 'reduce');
    await reduce.uncheck();
    assert.equal(await page.evaluate(() => document.documentElement.hasAttribute('data-motion-policy')), false);
    assert.deepEqual(pageErrors, []);
    assert.deepEqual(motionErrors, []);
  } finally { await browser.close(); }
});

test(`${name}: framework adapters play the exit before removing the card`, async () => {
  const browser = await browserType.launch();
  try {
    const context = await browser.newContext({ reducedMotion: 'no-preference' });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto(base + '/motion/demo/');
    for (const label of ['React', 'Angular', 'Svelte']) {
      const key = label.toLowerCase();
      const card = '[data-demo-card="' + key + '"]';
      const toggle = page.getByRole('button', { name: 'Toggle ' + label + ' card' });
      await page.waitForSelector(card);
      await page.waitForFunction(selector => document.querySelector(selector)?.getAttribute('data-presence') === 'present', card);
      // Recorded in the page: a framework may start the exit a task after the click.
      await page.evaluate(selector => {
        const element = document.querySelector(selector);
        window.__exitSeen = false;
        new MutationObserver(() => {
          if (element.isConnected && element.getAttribute('data-presence') === 'exiting') window.__exitSeen = true;
        }).observe(element, { attributes: true, attributeFilter: ['data-presence'] });
      }, card);
      await toggle.click();
      await page.waitForFunction(selector => document.querySelector(selector) === null, card);
      assert.equal(await page.evaluate(() => window.__exitSeen), true, label + ' card removed without playing its exit');
      await toggle.click();
      await page.waitForFunction(selector => document.querySelector(selector)?.getAttribute('data-presence') === 'present', card);
    }
    assert.deepEqual(pageErrors, []);
  } finally { await browser.close(); }
});

test(`${name}: layout motions carry elements to their new place`, async () => {
  const browser = await browserType.launch();
  try {
    const context = await browser.newContext({ javaScriptEnabled: true, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto(base + '/motion/demo/');
    await page.waitForSelector('[data-demo-layout="pill"]');
    // The layout engine is loaded on demand: wait for the page to be quiet before the first change.
    await page.waitForLoadState('networkidle');
    // Two frames: the runtime is connected once the page has painted.
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const pill = page.locator('[data-demo-layout="pill"]');
    const oldLeft = await pill.evaluate(el => el.getBoundingClientRect().left);
    // Click and read in the page, in one task: the move has just started and the pill is still where it was.
    const started = await page.evaluate(async () => {
      const element = document.querySelector('[data-demo-layout="pill"]');
      document.querySelector('[data-demo-align]').click();
      await Promise.resolve();
      return { animations: element.getAnimations().length, left: element.getBoundingClientRect().left };
    });
    assert.ok(started.animations >= 1, 'the pill has no move in flight');
    assert.ok(Math.abs(started.left - oldLeft) < 2, `the pill jumped from ${oldLeft} to ${started.left}`);
    await page.waitForFunction(() => document.querySelector('[data-demo-layout="pill"]').getAnimations().length === 0);
    const ended = await pill.evaluate(el => ({ left: el.getBoundingClientRect().left, translate: el.style.translate, scale: el.style.scale }));
    assert.ok(ended.left > oldLeft + 40, `the pill ended at ${ended.left}, it started at ${oldLeft}`);
    assert.equal(ended.translate, '');
    assert.equal(ended.scale, '');

    await page.getByRole('button', { name: 'Move first to end' }).click();
    const items = '#demo-list [data-demo-layout="item"]';
    await page.waitForFunction(selector => [...document.querySelectorAll(selector)].some(el => el.getAnimations().length > 0), items);
    await page.waitForFunction(selector => [...document.querySelectorAll(selector)].every(el => el.getAnimations().length === 0), items);
    const order = await page.evaluate(selector => {
      const elements = [...document.querySelectorAll(selector)];
      const dom = elements.map(el => el.textContent.trim());
      const visual = [...elements].sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top).map(el => el.textContent.trim());
      return { dom, visual };
    }, items);
    assert.deepEqual(order.visual, order.dom);
    assert.equal(order.dom[0], 'Two');

    // Size: the content of a card keeps its shape while the card grows.
    const measureSize = () => {
      const card = document.querySelector('#demo-size [data-demo-layout="card"]').getBoundingClientRect();
      const chip = document.querySelector('#demo-size [data-demo-layout="chip"]').getBoundingClientRect();
      return { cardWidth: card.width, chipWidth: chip.width, chipHeight: chip.height, chipGap: card.right - chip.right };
    };
    const rest = await page.evaluate(measureSize);
    await page.getByRole('button', { name: 'Toggle width' }).click();
    // Every animation of the card and its content is held at the same moment, halfway through the move.
    await page.evaluate(() => {
      for (const animation of document.querySelector('#demo-size').getAnimations({ subtree: true })) {
        animation.pause();
        animation.currentTime = 80;
      }
    });
    const middle = await page.evaluate(measureSize);
    assert.ok(Math.abs(middle.cardWidth - rest.cardWidth) > 5, `the card is still ${middle.cardWidth}px wide, it was ${rest.cardWidth}px`);
    assert.ok(Math.abs(middle.chipWidth - rest.chipWidth) <= 1, `the chip is ${middle.chipWidth}px wide mid-move, it is ${rest.chipWidth}px at rest`);
    assert.ok(Math.abs(middle.chipHeight - rest.chipHeight) <= 1, `the chip is ${middle.chipHeight}px high mid-move, it is ${rest.chipHeight}px at rest`);
    assert.ok(Math.abs(middle.chipGap - rest.chipGap) <= 2, `the chip is ${middle.chipGap}px from the card edge mid-move, it was ${rest.chipGap}px`);
    await page.evaluate(() => {
      for (const animation of document.querySelector('#demo-size').getAnimations({ subtree: true })) animation.play();
    });
    await page.waitForFunction(() => document.querySelector('#demo-size').getAnimations({ subtree: true }).length === 0);
    const final = await page.evaluate(measureSize);
    assert.ok(Math.abs(middle.cardWidth - final.cardWidth) > 5, `the card was ${middle.cardWidth}px wide mid-move and ${final.cardWidth}px at the end`);
    assert.equal(await page.evaluate(() => [...document.querySelectorAll('#demo-size *')].some(el => el.style.translate !== '' || el.style.scale !== '')), false);
    assert.deepEqual(pageErrors, []);
  } finally { await browser.close(); }
});

test(`${name}: list items cascade in and their neighbours follow`, async () => {
  const browser = await browserType.launch();
  try {
    const context = await browser.newContext({ javaScriptEnabled: true, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto(base + '/motion/demo/');
    const items = '#demo-items [data-demo-list="item"]';
    await page.waitForSelector(items);
    await page.waitForLoadState('networkidle');
    // Two frames: the runtime is connected once the page has painted.
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const count = () => page.locator(items).count();
    const texts = () => page.locator(items).allTextContents();
    const waitForRest = () => page.waitForFunction(() => [...document.querySelectorAll('#demo-items *')].every(el => el.getAnimations().length === 0));
    // The items in DOM order and in visual order (by top), and the gaps between consecutive boxes.
    const layout = () => page.evaluate(selector => {
      const elements = [...document.querySelectorAll(selector)];
      const dom = elements.map(el => el.textContent.trim());
      const visual = [...elements].sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top).map(el => el.textContent.trim());
      const boxes = elements.map(el => el.getBoundingClientRect());
      const gaps = boxes.slice(1).map((box, index) => box.top - boxes[index].bottom);
      return { dom, visual, gaps };
    }, items);

    // Add five: five items entering in one task cascade one step apart, in visual order.
    await page.getByRole('button', { name: 'Add five' }).click();
    const delays = await page.evaluate(selector => [...document.querySelectorAll(selector)].slice(-5).map(el => {
      const values = el.getAnimations().map(animation => animation.effect.getTiming().delay);
      return values.length > 0 ? Math.max(...values) : null;
    }), items);
    assert.deepEqual(delays, [0, 50, 100, 150, 200]);
    await page.waitForFunction(selector => [...document.querySelectorAll(selector)].every(el => el.getAttribute('data-presence') === 'present'), items);
    assert.equal(await count(), 8);

    // Add item: the new item goes first, and the item that was first moves down.
    const previousFirst = (await texts())[0];
    const topBefore = await page.locator(items).first().evaluate(el => el.getBoundingClientRect().top + window.scrollY);
    await page.getByRole('button', { name: 'Add item' }).click();
    await waitForRest();
    assert.equal(await count(), 9);
    assert.equal((await texts())[1], previousFirst);
    assert.notEqual((await texts())[0], previousFirst);
    const topAfter = await page.locator(items).nth(1).evaluate(el => el.getBoundingClientRect().top + window.scrollY);
    assert.ok(topAfter > topBefore, `the previous first item is at ${topAfter}, it was at ${topBefore}`);

    // Remove first: the new item leaves, and the list closes up with the 8 px gap of gap-2.
    const beforeRemove = await count();
    await page.getByRole('button', { name: 'Remove first' }).click();
    await page.waitForFunction(([selector, expected]) => document.querySelectorAll(selector).length === expected, [items, beforeRemove - 1]);
    await waitForRest();
    let order = await layout();
    assert.deepEqual(order.visual, order.dom);
    assert.equal(order.dom[0], 'Item 1');
    for (const gap of order.gaps) assert.ok(Math.abs(gap - 8) <= 1, `gap of ${gap}px between list items`);

    // Close the gap: the first item leaves the flow as it fades, and the second item moves up while it is still there.
    await page.getByLabel('Close the gap while leaving').check();
    const beforeOutflow = await count();
    await page.getByRole('button', { name: 'Remove first' }).click();
    const moving = await page.evaluate(selector => document.querySelectorAll(selector)[1].getAnimations().length, items);
    assert.ok(moving >= 1, 'the second item does not move while the first one leaves');
    await page.waitForFunction(([selector, expected]) => document.querySelectorAll(selector).length === expected, [items, beforeOutflow - 1]);
    await waitForRest();
    order = await layout();
    assert.deepEqual(order.visual, order.dom);
    assert.equal(order.dom[0], 'Item 2');
    for (const gap of order.gaps) assert.ok(Math.abs(gap - 8) <= 1, `gap of ${gap}px between list items`);
    assert.deepEqual(pageErrors, []);
  } finally { await browser.close(); }
});

test(`${name}: a shared element morphs between a thumbnail and its detail`, async () => {
  const browser = await browserType.launch();
  try {
    const context = await browser.newContext({ javaScriptEnabled: true, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto(base + '/motion/demo/');
    await page.waitForSelector('[data-demo-shot="2"]');
    // The layout engine is loaded on demand: wait for the page to be quiet before the first change.
    await page.waitForLoadState('networkidle');
    // Two frames: the runtime is connected once the page has painted.
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    // Page coordinates, so that a scroll between two reads does not count as a move.
    const initial = await page.evaluate(() => {
      const rect = document.querySelector('[data-demo-shot="2"]').getBoundingClientRect();
      return { left: rect.left, top: rect.top + window.scrollY, width: rect.width, height: rect.height };
    });

    // Open: click and read in one task. The detail has just started from where the thumbnail was.
    const opened = await page.evaluate(async () => {
      const thumb = document.querySelector('[data-demo-shot="2"]');
      const from = thumb.getBoundingClientRect();
      thumb.click();
      await Promise.resolve();
      const detail = document.getElementById('demo-detail');
      const to = detail.getBoundingClientRect();
      return {
        animations: detail.getAnimations().length,
        from: { left: from.left, top: from.top, width: from.width, height: from.height },
        to: { left: to.left, top: to.top, width: to.width, height: to.height },
      };
    });
    assert.ok(opened.animations >= 1, 'the detail has no morph in flight');
    for (const key of ['left', 'top', 'width', 'height'])
      assert.ok(Math.abs(opened.to[key] - opened.from[key]) <= 2, `the detail's ${key} is ${opened.to[key]}, the thumbnail's is ${opened.from[key]}`);
    await page.waitForFunction(() => document.getElementById('demo-detail').getAnimations().length === 0);
    const shown = await page.evaluate(() => {
      const detail = document.getElementById('demo-detail');
      return {
        hidden: detail.hidden,
        display: getComputedStyle(detail).display,
        width: detail.getBoundingClientRect().width,
        thumbHidden: document.querySelector('[data-demo-shot="2"]').hidden,
        translate: detail.style.translate,
        scale: detail.style.scale,
        borderRadius: detail.style.borderRadius,
      };
    });
    assert.equal(shown.hidden, false);
    assert.notEqual(shown.display, 'none');
    assert.ok(shown.width > 200, `the detail is ${shown.width}px wide`);
    assert.equal(shown.thumbHidden, true);
    assert.equal(shown.translate, '');
    assert.equal(shown.scale, '');
    assert.equal(shown.borderRadius, '');

    // Close: click and read in one task. The thumbnail has just started from where the detail was.
    const closing = await page.evaluate(async () => {
      const detail = document.getElementById('demo-detail');
      const from = detail.getBoundingClientRect();
      document.querySelector('[data-demo-close]').click();
      await Promise.resolve();
      const thumb = document.querySelector('[data-demo-shot="2"]');
      const to = thumb.getBoundingClientRect();
      return {
        animations: thumb.getAnimations().length,
        from: { left: from.left, top: from.top, width: from.width, height: from.height },
        to: { left: to.left, top: to.top, width: to.width, height: to.height },
      };
    });
    assert.ok(closing.animations >= 1, 'the thumbnail has no morph in flight');
    for (const key of ['left', 'top', 'width', 'height'])
      assert.ok(Math.abs(closing.to[key] - closing.from[key]) <= 2, `the thumbnail's ${key} is ${closing.to[key]}, the detail's is ${closing.from[key]}`);
    await page.waitForFunction(() => document.querySelector('[data-demo-shot="2"]').getAnimations().length === 0);
    const back = await page.evaluate(() => {
      const rect = document.querySelector('[data-demo-shot="2"]').getBoundingClientRect();
      return { left: rect.left, top: rect.top + window.scrollY, width: rect.width, height: rect.height, detailHidden: document.getElementById('demo-detail').hidden };
    });
    for (const key of ['left', 'top', 'width', 'height'])
      assert.ok(Math.abs(back[key] - initial[key]) <= 1, `the thumbnail's ${key} is ${back[key]}, it was ${initial[key]}`);
    assert.equal(back.detailHidden, true);
    assert.deepEqual(pageErrors, []);
  } finally { await browser.close(); }
});

test(`${name}: cards reveal as they scroll into view`, async () => {
  const browser = await browserType.launch();
  try {
    const context = await browser.newContext({ javaScriptEnabled: true, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto(base + '/motion/demo/');
    await page.waitForSelector('[data-demo-reveal]');
    // The reveal is bound at connect: wait for the page to be quiet, then two frames.
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const cards = '[data-demo-reveal]';
    // At load every card is below the fold, in its first frame.
    const atLoad = await page.evaluate(selector => [...document.querySelectorAll(selector)].map(el => ({
      below: el.getBoundingClientRect().top >= window.innerHeight,
      opacity: getComputedStyle(el).opacity,
    })), cards);
    assert.equal(atLoad.length, 12);
    assert.ok(atLoad.every(card => card.below), 'a card is in view at load');
    assert.ok(atLoad.every(card => card.opacity === '0'), 'a card below the fold is not in its first frame');
    // Scroll down by a third of the viewport at a time, so that every card is in view at some step of the scroll.
    await page.evaluate(async selector => {
      const frames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const last = [...document.querySelectorAll(selector)].at(-1);
      const end = last.getBoundingClientRect().top + window.scrollY - window.innerHeight / 2;
      const step = window.innerHeight / 3;
      for (let y = window.scrollY; ; y = Math.min(y + step, end)) {
        window.scrollTo(0, y);
        await frames();
        if (y >= end) break;
      }
    }, cards);
    await page.waitForFunction(selector => [...document.querySelectorAll(selector)].every(el => el.getAnimations().length === 0), cards);
    const after = await page.evaluate(selector => [...document.querySelectorAll(selector)].map(el => ({
      opacity: getComputedStyle(el).opacity,
      translate: getComputedStyle(el).translate,
    })), cards);
    assert.equal(after.length, 12);
    for (const card of after) {
      assert.equal(card.opacity, '1');
      assert.ok(['none', '0px', '0px 0px'].includes(card.translate), `a card rests at translate ${card.translate}`);
    }
    assert.deepEqual(pageErrors, []);
  } finally { await browser.close(); }
});

test(`${name}: tiles follow the scroll, or stay still without support`, async () => {
  const browser = await browserType.launch();
  try {
    const context = await browser.newContext({ javaScriptEnabled: true, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto(base + '/motion/demo/');
    await page.waitForSelector('[data-demo-scrub]');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    // The top edge of the first tile at 80 %, then at 20 %, of the viewport height: two frames after each scroll.
    const { native, low, high } = await page.evaluate(async () => {
      const frames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const tile = document.querySelector('[data-demo-scrub]');
      const pageTop = tile.getBoundingClientRect().top + window.scrollY;
      const at = async fraction => {
        window.scrollTo(0, pageTop - fraction * window.innerHeight);
        await frames();
        return getComputedStyle(tile).translate;
      };
      const lowValue = await at(0.8);
      const highValue = await at(0.2);
      return { native: typeof ViewTimeline === 'function', low: lowValue, high: highValue };
    });
    // A single value is the x offset alone: the y offset is then 0, which the browser may leave out.
    const offsetY = value => (value === 'none' ? 0 : Number.parseFloat(value.split(' ')[1] ?? '0'));
    if (native) assert.ok(Math.abs(offsetY(low) - offsetY(high)) > 20, `the tile moved from ${low} to ${high}`);
    else for (const value of [low, high]) assert.ok(['none', '0px', '0px 0px'].includes(value), `the tile moved to ${value} without a scroll link`);
    assert.deepEqual(pageErrors, []);
  } finally { await browser.close(); }
});

test(`${name}: loops run, pause on demand and resume`, async () => {
  const browser = await browserType.launch();
  try {
    const context = await browser.newContext({ javaScriptEnabled: true, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto(base + '/motion/demo/');
    await page.waitForSelector('[data-demo-loop]');
    await page.waitForLoadState('networkidle');
    const loops = '[data-demo-loop]';
    await page.evaluate(selector => document.querySelector(selector).scrollIntoView(), loops);
    // Two frames: the loops have been told that they are in view.
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    // One entry per loop: the play states of its animations.
    const playStates = () => page.evaluate(selector => [...document.querySelectorAll(selector)].map(el => el.getAnimations().map(animation => animation.playState)), loops);
    assert.deepEqual(await playStates(), [['running'], ['running'], ['running']]);
    const toggle = page.getByRole('button', { name: /^(Pause|Play) loops$/ });
    await toggle.click();
    await page.waitForFunction(selector => [...document.querySelectorAll(selector)].every(el => el.getAnimations()[0]?.playState === 'paused'), loops);
    assert.deepEqual(await playStates(), [['paused'], ['paused'], ['paused']]);
    await toggle.click();
    await page.waitForFunction(selector => [...document.querySelectorAll(selector)].every(el => el.getAnimations()[0]?.playState === 'running'), loops);
    assert.deepEqual(await playStates(), [['running'], ['running'], ['running']]);
    assert.deepEqual(pageErrors, []);
  } finally { await browser.close(); }
});
}
