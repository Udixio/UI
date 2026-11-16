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
    for (const path of ['/motion/', '/motion/roadmap/', '/motion/tokens/', '/motion/accessibility/', '/motion/demo/']) {
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
    await page.getByRole('navigation', { name: 'Motion documentation' }).getByRole('link', { name: 'Demo' }).click();
    await page.waitForFunction(() => location.pathname.startsWith('/motion/demo'));
    await page.waitForFunction(() => document.title.startsWith('Motion demo'));
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
    for (const path of ['/motion/', '/motion/roadmap/', '/motion/demo/']) {
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

test(`${name}: a client navigation tells the new page its direction of travel`, async () => {
  const browser = await browserType.launch();
  try {
    const page = await browser.newPage();
    await page.goto(base + '/motion/');
    // Recorded on each swap the router makes: the new page's <html> must carry the direction, as Astro replaces the attributes.
    await page.evaluate(() => {
      window.__dir = undefined;
      document.addEventListener('astro:before-swap', event => {
        window.__dir = event.newDocument.documentElement.dataset.motionDirection;
      });
    });
    await Promise.all([
      page.waitForURL('**/motion/roadmap/'),
      page.getByRole('navigation', { name: 'Motion documentation' }).getByRole('link', { name: 'Roadmap' }).click(),
    ]);
    assert.equal(await page.evaluate(() => window.__dir), 'forward');
    await page.evaluate(() => { window.__dir = undefined; history.back(); });
    await page.waitForFunction(() => window.__dir !== undefined);
    assert.equal(await page.evaluate(() => window.__dir), 'back');
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

test(`${name}: values follow the pointer and the scroll`, async () => {
  const browser = await browserType.launch();
  try {
    const context = await browser.newContext({ javaScriptEnabled: true, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto(base + '/motion/demo/');
    await page.waitForSelector('[data-demo-tilt]');
    // The values are bound once the page is quiet; then two frames.
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    // The pointer at 75 % of the card's width and at its middle height: the x value goes to 4 (the range is -8 to 8).
    await page.evaluate(() => {
      const card = document.querySelector('[data-demo-tilt]');
      const box = card.getBoundingClientRect();
      card.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: box.left + box.width * 0.75, clientY: box.top + box.height / 2 }));
    });
    await page.waitForFunction(() => Math.abs(Number(getComputedStyle(document.querySelector('[data-demo-tilt]')).getPropertyValue('--udx-motion-value-demo-tilt-x')) - 4) < 0.2);
    const tiltX = await page.evaluate(() => Number(getComputedStyle(document.querySelector('[data-demo-tilt]')).getPropertyValue('--udx-motion-value-demo-tilt-x')));
    assert.ok(Math.abs(tiltX - 4) < 0.2, `the tilt is ${tiltX} at 75 % of the card, expected 4`);
    // Half of the scrollable height is half of the scroll progress.
    await page.evaluate(() => window.scrollTo(0, (document.documentElement.scrollHeight - window.innerHeight) / 2));
    await page.waitForFunction(() => Math.abs(Number(getComputedStyle(document.querySelector('[data-demo-reading]')).getPropertyValue('--udx-motion-value-demo-reading')) - 0.5) < 0.05);
    const reading = await page.evaluate(() => Number(getComputedStyle(document.querySelector('[data-demo-reading]')).getPropertyValue('--udx-motion-value-demo-reading')));
    assert.ok(Math.abs(reading - 0.5) < 0.05, `the scroll progress is ${reading}, expected 0.5`);
    assert.deepEqual(pageErrors, []);
  } finally { await browser.close(); }
});

test(`${name}: counters count when they enter the view`, async () => {
  const browser = await browserType.launch();
  try {
    const context = await browser.newContext({ javaScriptEnabled: true, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto(base + '/motion/demo/');
    await page.waitForSelector('[data-demo-count]');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    // Out of view at load, the counter shows its start: its shown number is in a span hidden from assistive technology.
    await page.waitForFunction(() => document.querySelector('[data-demo-count] [aria-hidden="true"]') !== null);
    const start = await page.locator('[data-demo-count] [aria-hidden="true"]').textContent();
    assert.equal(start, '0', 'the counter does not start at 0');
    const formatted = value => page.evaluate(number => new Intl.NumberFormat(document.documentElement.lang || undefined, { maximumFractionDigits: 0 }).format(number), value);
    const single = async text => page.waitForFunction(([selector, expected]) => {
      const element = document.querySelector(selector);
      return element !== null && element.childNodes.length === 1 && element.firstChild.nodeType === Node.TEXT_NODE && element.textContent === expected;
    }, ['[data-demo-count]', text]);
    // Scrolled into view, it counts up to its value, and ends as one text node holding that number.
    const twelve = await formatted(12480);
    await page.evaluate(() => document.querySelector('[data-demo-count]').scrollIntoView({ block: 'center' }));
    await single(twelve);
    // Adding 1,000 visitors: the count moves to 13,480 and ends as one text node holding that number.
    await page.getByRole('button', { name: 'Add 1,000 visitors' }).click();
    const thirteen = await formatted(13480);
    await single(thirteen);
    assert.equal(await page.locator('[data-demo-count]').getAttribute('value'), '13480');
    assert.deepEqual(pageErrors, []);
  } finally { await browser.close(); }
});

test(`${name}: a sequence plays its steps in order`, async () => {
  const browser = await browserType.launch();
  try {
    const context = await browser.newContext({ javaScriptEnabled: true, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto(base + '/motion/demo/');
    await page.waitForSelector('[data-motion="demo-hero"]');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    // Scrolled into view, the reveal starts the steps: wait until the title is animating, then read every delay in one task.
    await page.evaluate(() => document.querySelector('[data-motion="demo-hero"]').scrollIntoView());
    await page.waitForFunction(() => document.querySelector('[data-motion-step="title"]').getAnimations().length > 0);
    const timing = await page.evaluate(() => {
      const delayOf = element => Math.max(...element.getAnimations().map(animation => animation.effect.getTiming().delay));
      const durationOf = element => Math.max(...element.getAnimations().map(animation => animation.effect.getTiming().duration));
      const title = document.querySelector('[data-motion-step="title"]');
      const subtitle = document.querySelector('[data-motion-step="subtitle"]');
      const actions = [...document.querySelectorAll('[data-motion-step="actions"]')];
      return {
        title: delayOf(title),
        titleDuration: durationOf(title),
        subtitle: delayOf(subtitle),
        subtitleEnd: delayOf(subtitle) + durationOf(subtitle),
        actions: actions.map(delayOf),
      };
    });
    assert.equal(timing.title, 0, 'the title does not start at once');
    assert.ok(Math.abs(timing.subtitle - 50) <= 1, `the subtitle starts at ${timing.subtitle} ms, expected 50`);
    assert.equal(timing.actions.length, 3);
    const [first, second, third] = timing.actions;
    assert.ok(Math.abs(second - first - 20) <= 1, `the second action starts ${second - first} ms after the first, expected 20`);
    assert.ok(Math.abs(third - first - 40) <= 1, `the third action starts ${third - first} ms after the first, expected 40`);
    assert.ok(first >= timing.titleDuration - 1, `the actions start at ${first} ms, before the title ends at ${timing.titleDuration} ms`);
    assert.ok(first >= timing.subtitleEnd - 1, `the actions start at ${first} ms, before the subtitle ends at ${timing.subtitleEnd} ms`);
    await page.waitForFunction(() => document.querySelector('[data-motion="demo-hero"]').getAnimations({ subtree: true }).length === 0);
    const opacities = await page.evaluate(() => [...document.querySelectorAll('[data-motion="demo-hero"] [data-motion-step]')].map(element => getComputedStyle(element).opacity));
    assert.deepEqual(opacities, ['1', '1', '1', '1', '1']);
    assert.deepEqual(pageErrors, []);
  } finally { await browser.close(); }
});

test(`${name}: a chip can be dragged and nudged with the keyboard`, async () => {
  const browser = await browserType.launch();
  try {
    const context = await browser.newContext({ javaScriptEnabled: true, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto(base + '/motion/demo/');
    await page.waitForSelector('[data-demo-drag]');
    // The gesture is bound at connect: wait for the page to be quiet, then two frames.
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const chip = page.locator('[data-demo-drag]');
    const area = page.locator('#demo-drag-area');
    await area.scrollIntoViewIfNeeded();
    // A release is over when the chip reports motion-dragend: it fires once the spring is at rest. Two equal frames are not
    // enough, as the release frame and the one before it can show the same translate.
    const armDragEnd = () => page.evaluate(() => {
      window.__dragEnded = false;
      document.querySelector('[data-demo-drag]').addEventListener('motion-dragend', () => { window.__dragEnded = true; }, { once: true });
    });
    const before = await chip.boundingBox();
    const areaBox = await area.boundingBox();
    const centre = { x: before.x + before.width / 2, y: before.y + before.height / 2 };
    await page.mouse.move(centre.x, centre.y);
    await page.mouse.down();
    await page.mouse.move(centre.x + 120, centre.y + 40, { steps: 6 });
    await armDragEnd();
    await page.mouse.up();
    await page.waitForFunction(() => window.__dragEnded);
    const dragged = await chip.boundingBox();
    assert.ok(dragged.x - before.x >= 100, `the chip moved ${dragged.x - before.x} px, expected at least 100`);
    assert.ok(dragged.x >= areaBox.x && dragged.x + dragged.width <= areaBox.x + areaBox.width, 'the chip is outside the area on the x axis');
    assert.ok(dragged.y >= areaBox.y && dragged.y + dragged.height <= areaBox.y + areaBox.height, 'the chip is outside the area on the y axis');
    // Focused, one press of ArrowLeft moves the chip 16 px to the left.
    await chip.focus();
    const beforeKey = await chip.boundingBox();
    // The nudge is written in the keydown, without a release.
    await page.keyboard.press('ArrowLeft');
    const afterKey = await chip.boundingBox();
    assert.ok(Math.abs(beforeKey.x - afterKey.x - 16) <= 1, `the chip moved ${beforeKey.x - afterKey.x} px left, expected 16`);
    assert.deepEqual(pageErrors, []);
  } finally { await browser.close(); }
});

test(`${name}: an item swipes away and the list closes up`, async () => {
  const browser = await browserType.launch();
  try {
    const context = await browser.newContext({ javaScriptEnabled: true, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto(base + '/motion/demo/');
    const items = '#demo-swipe-list [data-demo-swipe]';
    await page.waitForSelector(items);
    // The gesture is bound at connect: wait for the page to be quiet, then two frames.
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const count = () => page.locator(items).count();
    const texts = () => page.locator(items).allTextContents();
    const waitForRest = () => page.waitForFunction(() => [...document.querySelectorAll('#demo-swipe-list *')].every(el => el.getAnimations().length === 0));
    // The items in DOM order and in visual order (by top), and the gaps between consecutive boxes.
    const layout = () => page.evaluate(selector => {
      const elements = [...document.querySelectorAll(selector)];
      const dom = elements.map(el => el.textContent.trim());
      const visual = [...elements].sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top).map(el => el.textContent.trim());
      const boxes = elements.map(el => el.getBoundingClientRect());
      const gaps = boxes.slice(1).map((box, index) => box.top - boxes[index].bottom);
      return { dom, visual, gaps };
    }, items);
    assert.equal(await count(), 4);

    // Dragged to the right edge of the viewport, in five steps: past 40 % of its size, so it flies out. The pointer stays in the
    // viewport: Playwright's synthetic input in Firefox reports clientX 0 and drops the pointerup outside it.
    const first = page.locator(items).first();
    await first.scrollIntoViewIfNeeded();
    const box = await first.boundingBox();
    const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    const end = Math.min(start.x + box.width * 0.7, page.viewportSize().width - 2);
    assert.ok(end - start.x > box.width * 0.45, `the drag only covers ${Math.round((end - start.x) / box.width * 100)} % of the item`);
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(end, start.y, { steps: 5 });
    await page.mouse.up();
    await page.waitForFunction(([selector, expected]) => document.querySelectorAll(selector).length === expected, [items, 3]);
    await waitForRest();
    let order = await layout();
    assert.deepEqual(order.dom, ['Notification 2', 'Notification 3', 'Notification 4']);
    assert.deepEqual(order.visual, order.dom);
    for (const gap of order.gaps) assert.ok(Math.abs(gap - 8) <= 1, `gap of ${gap}px between list items`);

    // Focused, Delete swipes the new first item away too.
    await page.locator(items).first().focus();
    await page.keyboard.press('Delete');
    await page.waitForFunction(([selector, expected]) => document.querySelectorAll(selector).length === expected, [items, 2]);
    assert.deepEqual(await texts(), ['Notification 3', 'Notification 4']);
    assert.deepEqual(pageErrors, []);
  } finally { await browser.close(); }
});

test(`${name}: tasks reorder with the keyboard`, async () => {
  const browser = await browserType.launch();
  try {
    const context = await browser.newContext({ javaScriptEnabled: true, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto(base + '/motion/demo/');
    const tasks = '#demo-reorder [data-demo-reorder]';
    await page.waitForSelector(tasks);
    // The gesture is bound at connect: wait for the page to be quiet, then two frames.
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    // Space grabs Task 2, ArrowDown moves it past Task 3, and Space drops it.
    await page.locator(tasks, { hasText: /^Task 2$/ }).focus();
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Space');
    const names = () => page.evaluate(selector => [...document.querySelectorAll(selector)].map(el => el.textContent.trim()), tasks);
    assert.deepEqual(await names(), ['Task 1', 'Task 3', 'Task 2', 'Task 4', 'Task 5']);
    assert.equal(await page.locator('[data-udx-motion-live]').textContent(), 'Dropped. Position 3 of 5.');
    await page.waitForFunction(() => [...document.querySelectorAll('#demo-reorder *')].every(el => el.getAnimations().length === 0));
    const visual = await page.evaluate(selector => [...document.querySelectorAll(selector)].sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top).map(el => el.textContent.trim()), tasks);
    assert.deepEqual(visual, await names());
    assert.deepEqual(pageErrors, []);
  } finally { await browser.close(); }
});

test(`${name}: a heading is revealed word by word, and read once`, async () => {
  const browser = await browserType.launch();
  try {
    const context = await browser.newContext({ javaScriptEnabled: true, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto(base + '/motion/demo/');
    const heading = '[data-motion="demo-title-words"]';
    await page.waitForSelector(heading);
    // The reveal is bound at connect: wait for the page to be quiet, then two frames.
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    // Out of view, the heading waits in its first frame, and is not cut into words yet.
    const atLoad = await page.evaluate(selector => {
      const element = document.querySelector(selector);
      return {
        below: element.getBoundingClientRect().top >= window.innerHeight,
        opacity: getComputedStyle(element).opacity,
        pieces: element.querySelectorAll('[data-udx-piece]').length,
      };
    }, heading);
    assert.ok(atLoad.below, 'the heading is in view at load');
    assert.equal(atLoad.opacity, '0');
    assert.equal(atLoad.pieces, 0);
    // Scrolled into view, the five words play in order and end at opacity 1.
    await page.evaluate(selector => document.querySelector(selector).scrollIntoView(), heading);
    await page.waitForFunction(selector => document.querySelectorAll(`${selector} [data-udx-piece]`).length > 0, heading);
    await page.waitForFunction(selector => document.querySelector(selector).getAnimations({ subtree: true }).length === 0, heading);
    const split = await page.evaluate(selector => {
      const element = document.querySelector(selector);
      const pieces = [...element.querySelectorAll('[data-udx-piece]')];
      return {
        words: pieces.map(piece => piece.textContent),
        opacities: pieces.map(piece => getComputedStyle(piece).opacity),
        headingOpacity: getComputedStyle(element).opacity,
        copyHidden: element.querySelector('[data-udx-split]')?.getAttribute('aria-hidden'),
        source: element.querySelector('[data-udx-split-source]')?.textContent,
      };
    }, heading);
    assert.deepEqual(split.words, ['Each', 'word', 'arrives', 'in', 'turn']);
    assert.deepEqual(split.opacities, ['1', '1', '1', '1', '1']);
    assert.equal(split.headingOpacity, '1');
    // The visual copy is hidden from the accessibility tree, and the text is read once, in full, from the source.
    assert.equal(split.copyHidden, 'true');
    assert.equal(split.source, 'Each word arrives in turn');
    assert.equal(await page.getByRole('heading', { name: 'Each word arrives in turn', exact: true }).count(), 1);
    assert.deepEqual(pageErrors, []);
  } finally { await browser.close(); }
});

test(`${name}: a check is drawn again, a dot travels again, and an icon morphs into a pause mark`, async () => {
  const browser = await browserType.launch();
  try {
    const context = await browser.newContext({ javaScriptEnabled: true, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto(base + '/motion/demo/');
    await page.waitForSelector('[data-demo-draw-again]');
    // The motions are bound at connect: wait for the page to be quiet, then two frames.
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    // The dot rests at the end of its track, where its entry ends.
    assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('[data-demo-travel]')).offsetDistance), '100%');

    // A replay is three changes of the presence, from the one it had: out (exiting), in (entering), then present. The
    // records are taken from the click on, so the test sees the replay whatever the load.
    const recordPresence = selector => page.evaluate(target => {
      window.__presence = [];
      new MutationObserver(records => {
        for (const record of records) window.__presence.push(record.oldValue);
      }).observe(document.querySelector(target), { attributes: true, attributeFilter: ['data-presence'], attributeOldValue: true });
    }, selector);
    const replayed = selector => page.waitForFunction(target => window.__presence.length === 3 && document.querySelector(target).getAnimations().length === 0, selector, { timeout: 20000 });

    // Draw again: the check undraws, then draws, and at rest the stroke is whole with no dash inline.
    await recordPresence('[data-demo-draw]');
    await page.locator('[data-demo-draw-again]').click();
    await replayed('[data-demo-draw]');
    assert.deepEqual(await page.evaluate(() => window.__presence), ['present', 'exiting', 'entering']);
    const drawn = await page.evaluate(() => {
      const path = document.querySelector('[data-demo-draw]');
      return { offset: parseFloat(getComputedStyle(path).strokeDashoffset), dash: path.style.strokeDasharray, inlineOffset: path.style.strokeDashoffset };
    });
    assert.ok(Math.abs(drawn.offset) <= 0.001, `the stroke ends at dash offset ${drawn.offset}, expected 0`);
    assert.equal(drawn.dash, '');
    assert.equal(drawn.inlineOffset, '');

    // Move again: the dot leaves its end, then comes back to it.
    await recordPresence('[data-demo-travel]');
    await page.locator('[data-demo-move-again]').click();
    await replayed('[data-demo-travel]');
    assert.deepEqual(await page.evaluate(() => window.__presence), ['present', 'exiting', 'entering']);
    assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('[data-demo-travel]')).offsetDistance), '100%');

    // Morph: the play triangle becomes the pause mark, its button is pressed, and the temporary path of the morph is gone.
    const PAUSE = 'M7 5 H10 V19 H7 Z M14 5 H17 V19 H14 Z';
    await page.locator('[data-demo-morph-button]').click();
    await page.waitForFunction(pause => document.querySelector('[data-demo-morph]').getAttribute('d') === pause, PAUSE, { timeout: 20000 });
    const morphed = await page.evaluate(() => ({
      pressed: document.querySelector('[data-demo-morph-button]').getAttribute('aria-pressed'),
      label: document.querySelector('[data-demo-morph-button]').getAttribute('aria-label'),
      paths: document.querySelectorAll('#demo-icon path').length,
    }));
    assert.deepEqual(morphed, { pressed: 'true', label: 'Morph the icon between play and pause', paths: 1 });
    assert.deepEqual(pageErrors, []);
  } finally { await browser.close(); }
});

test(`${name}: a scroll takes the page back to the text demo, and focuses its heading`, async () => {
  const browser = await browserType.launch();
  try {
    const context = await browser.newContext({ javaScriptEnabled: true, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto(base + '/motion/demo/');
    await page.waitForSelector('[data-demo-scroll-back]');
    // The gesture is bound at connect: wait for the page to be quiet, then two frames.
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    // The button is far below the heading of the text demo.
    await page.evaluate(() => document.querySelector('[data-demo-scroll-back]').scrollIntoView({ block: 'center' }));
    const before = await page.evaluate(() => window.scrollY);
    await page.locator('[data-demo-scroll-back]').click();
    // The scroll is over when the heading holds the focus, and its top is at the scroll margin (within 2 px).
    await page.waitForFunction(() => {
      const heading = document.getElementById('demo-text');
      const margin = Number.parseFloat(getComputedStyle(heading).scrollMarginTop) || 0;
      return document.activeElement === heading && Math.abs(heading.getBoundingClientRect().top - margin) <= 2;
    }, null, { timeout: 20000 });
    const after = await page.evaluate(() => {
      const heading = document.getElementById('demo-text');
      return {
        scrollY: window.scrollY,
        top: heading.getBoundingClientRect().top,
        margin: Number.parseFloat(getComputedStyle(heading).scrollMarginTop) || 0,
        focused: document.activeElement === heading,
      };
    });
    assert.ok(before - after.scrollY > 1000, `the page scrolled ${before - after.scrollY} px, expected more than 1000`);
    assert.ok(Math.abs(after.top - after.margin) <= 2, `the heading is ${after.top} px from the top, expected ${after.margin}`);
    assert.equal(after.focused, true);
    assert.deepEqual(pageErrors, []);
  } finally { await browser.close(); }
});
}
