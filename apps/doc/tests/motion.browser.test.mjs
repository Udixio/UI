// Run against a built site: MOTION_BROWSERS=chromium,firefox,webkit MOTION_DOC_URL=http://localhost:4322 node --test tests/motion.browser.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium, firefox, webkit } from 'playwright';

const base = process.env.MOTION_DOC_URL ?? 'http://localhost:4322';
const browserTypes = { chromium, firefox, webkit };
const browsers = (process.env.MOTION_BROWSERS ?? 'chromium').split(',').map(name => name.trim());

/** Two frames: the code after them has seen the page painted once. */
const frames = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));

/**
 * A scene mounts when its stage nears the view, and the layout engine loads with the first scene that needs it: bring the
 * stage to the view, wait until the scene is mounted (`ready`), then until the page is quiet and two frames have passed.
 */
async function bringScene(page, stage, ready) {
  await page.locator(stage).first().scrollIntoViewIfNeeded();
  await page.waitForSelector(ready);
  await page.waitForLoadState('networkidle');
  await frames(page);
}

/** The rail is a `client:load` island: its buttons react once the island has hydrated, not before. */
async function waitForRail(page) {
  await page.waitForFunction(() => {
    const island = document.querySelector('astro-island[component-export="Navigation"]');
    return island !== null && !island.hasAttribute('ssr');
  });
  await frames(page);
}

/**
 * Out of view, the heading holds its first frame: the text it shows is hidden, and no word has played. The frame is on the
 * words when the text module was loaded before the view observer first reported, and on the heading otherwise. Both are
 * the same to the reader, so the wait is for the frame itself, and the check is on the text the reader sees.
 */
async function expectHeldBelowFold(page, heading) {
  await page.waitForFunction(selector => {
    const element = document.querySelector(selector);
    const words = [...element.querySelectorAll('[data-udx-piece]')];
    return (words.length > 0 ? words : [element]).every(node => getComputedStyle(node).opacity === '0');
  }, heading);
  const atLoad = await page.evaluate(selector => {
    const element = document.querySelector(selector);
    return { below: element.getBoundingClientRect().top >= window.innerHeight, playing: element.getAnimations({ subtree: true }).length };
  }, heading);
  assert.ok(atLoad.below, 'the heading is in view at load');
  assert.equal(atLoad.playing, 0, 'a word plays before the heading is in view');
}

/**
 * Scrolled into view, the words of the heading play in order and end at opacity 1, and the sentence is read once, in full.
 */
async function expectWordsPlayed(page, heading, words, sentence) {
  await page.evaluate(selector => document.querySelector(selector).scrollIntoView(), heading);
  // The wait is for the final state: the words exist, held, before the view, so their count says nothing about their play.
  await page.waitForFunction(([selector, count]) => {
    const element = document.querySelector(selector);
    const pieces = [...element.querySelectorAll('[data-udx-piece]')];
    return pieces.length === count && pieces.every(word => getComputedStyle(word).opacity === '1') && element.getAnimations({ subtree: true }).length === 0;
  }, [heading, words.length]);
  const split = await page.evaluate(selector => {
    const element = document.querySelector(selector);
    const pieces = [...element.querySelectorAll('[data-udx-piece]')];
    return {
      words: pieces.map(piece => piece.textContent.trim()),
      opacities: pieces.map(piece => getComputedStyle(piece).opacity),
      headingOpacity: getComputedStyle(element).opacity,
      copyHidden: element.querySelector('[data-udx-split]')?.getAttribute('aria-hidden'),
      source: element.querySelector('[data-udx-split-source]')?.textContent,
    };
  }, heading);
  assert.deepEqual(split.words, words);
  assert.deepEqual(split.opacities, words.map(() => '1'));
  assert.equal(split.headingOpacity, '1');
  // The visual copy is hidden from the accessibility tree, and the text is read once, in full, from the source.
  assert.equal(split.copyHidden, 'true');
  // The source keeps the whitespace of the markup around the sentence: the sentence is what the reader gets.
  assert.equal(split.source.trim(), sentence);
}

for (const name of browsers) {
  if (!Object.hasOwn(browserTypes, name)) throw new Error(`Unknown MOTION_BROWSERS entry: ${name}`);
  const browserType = browserTypes[name];
test(`${name}: Motion works without JavaScript and applies reduced-motion policy`, async () => {
  const browser = await browserType.launch();
  try {
    const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    for (const path of ['/motion/', '/motion/roadmap/', '/motion/tokens/', '/motion/accessibility/']) {
      assert.equal((await page.goto(base + path)).status(), 200, path);
    }
    await page.goto(base + '/motion/');
    const navigation = page.getByRole('navigation', { name: 'Animation documentation' });
    const overview = navigation.getByRole('link', { name: 'Overview' });
    await overview.focus();
    await page.keyboard.press('Tab');
    assert.equal(await navigation.getByRole('link', { name: 'Getting started' }).evaluate(el => el === document.activeElement), true);
    await navigation.getByRole('link', { name: 'Glossary' }).focus();
    await Promise.all([page.waitForURL('**/motion/glossary/'), page.keyboard.press('Enter')]);
    assert.match(page.url(), /\/motion\/glossary\/?$/);
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

test(`${name}: the side panel lists the Animation pages by mechanism, each under its concept word`, async () => {
  const browser = await browserType.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(base + '/motion/');
    const navigation = page.locator('nav[aria-label="Animation documentation"]').first();
    await navigation.locator('a').first().waitFor();
    const sections = await navigation.evaluate(nav => [...nav.children].flatMap(child => {
      const category = child.querySelector('.text-label-small');
      return category ? [[category.textContent.trim(), [...child.querySelectorAll('a')].map(link => link.textContent.trim())]] : [];
    }));
    assert.deepEqual(sections, [
      ['Start', ['Overview', 'Getting started', 'How it works', 'Choosing an API']],
      ['Recipes', ['Dialog', 'Toasts', 'Accordion', 'Tab indicator', 'Navigation menu']],
      ['Motions', ['Presence', 'Emphasis', 'Layout', 'Lists', 'Shared elements', 'Reveal', 'Scrub', 'Loop', 'Text', 'SVG']],
      ['Values, gestures, sequences', ['Values', 'Gestures', 'Sequences']],
      ['Functions', ['animateStyle and springs', 'scrollTo', 'Page transitions']],
      ['System', ['Tokens', 'Presets', 'Accessibility', 'Per breakpoint', 'Loading and weight']],
      ['Reference', ['API', 'Glossary', 'Troubleshooting', 'Inspect and revert', 'Limits']],
    ]);
    // A page's H1 is its concept word, and the need, in the reader's words, is the subtitle under it.
    await page.goto(base + '/motion/presence/');
    assert.equal((await page.locator('h1').first().textContent()).trim(), 'Presence');
    assert.equal((await page.locator('h1 + p').first().textContent()).trim(), 'Show and hide');
  } finally { await browser.close(); }
});

test(`${name}: Motion rail stays selected for both section and legacy URL`, async () => {
  const browser = await browserType.launch();
  try {
    const page = await browser.newPage();
    await page.goto(base + '/motion/');
    await page.getByRole('navigation', { name: 'Animation documentation' }).getByRole('link', { name: 'Glossary' }).click();
    await page.waitForFunction(() => location.pathname.startsWith('/motion/glossary'));
    await page.waitForFunction(() => document.title.toLowerCase().includes('glossary'));
    assert.match(await page.title(), /glossary/i);
    const rail = page.locator('a.navigation-rail-item[href="/motion"]');
    await page.waitForFunction(() => document.querySelector('a[href="/motion"][aria-current="page"]') !== null);
    assert.equal(await rail.getAttribute('aria-current'), 'page');
    await page.getByRole('navigation', { name: 'Animation documentation' }).getByRole('link', { name: 'Limits' }).click();
    await page.waitForFunction(() => location.pathname.startsWith('/motion/limits'));
    await page.waitForFunction(() => document.title.toLowerCase().includes('limits'));
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
    for (const [path, current] of [['/motion/', 'Overview'], ['/motion/glossary/', 'Glossary'], ['/motion/limits/', 'Limits']]) {
      await page.goto(base + path);
      await page.waitForSelector('a[aria-current="page"]');
      assert.equal(await page.getByRole('link', { name: 'Animation', exact: true }).getAttribute('aria-current'), 'page', path);
      // The side panel marks the page it is on, as well as the rail.
      assert.equal(await page.getByRole('navigation', { name: 'Animation documentation' }).getByRole('link', { name: current, exact: true }).getAttribute('aria-current'), 'page', path);
    }
  } finally { await browser.close(); }
});

test(`${name}: the show and hide card hides and shows, and the rail's Reduce motion button sets the policy`, async () => {
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
    await page.goto(base + '/motion/presence/');
    await page.waitForFunction(() => document.querySelector('[data-presence-card]')?.getAttribute('data-motion-presence') === 'present');
    const toggle = page.locator('[data-presence-toggle]');
    await toggle.click();
    const hiding = await page.evaluate(() => {
      const card = document.querySelector('[data-presence-card]');
      return { hidden: card.hasAttribute('hidden'), inert: card.hasAttribute('inert'), display: getComputedStyle(card).display };
    });
    assert.equal(hiding.hidden, true);
    assert.equal(hiding.inert, true);
    assert.notEqual(hiding.display, 'none');
    await page.waitForFunction(() => getComputedStyle(document.querySelector('[data-presence-card]')).display === 'none');
    assert.equal(await page.locator('[data-presence-card]').evaluate(el => el.hasAttribute('hidden')), true);
    await toggle.click();
    await page.waitForFunction(() => {
      const card = document.querySelector('[data-presence-card]');
      return card.getAttribute('data-motion-presence') === 'present' && !card.hasAttribute('inert');
    });
    const shown = await page.locator('[data-presence-card]').evaluate(el => ({ hidden: el.hasAttribute('hidden'), opacity: getComputedStyle(el).opacity }));
    assert.equal(shown.hidden, false);
    assert.equal(shown.opacity, '1');
    await waitForRail(page);
    const reduce = page.getByRole('button', { name: 'Reduce motion', exact: true });
    assert.equal(await reduce.getAttribute('aria-pressed'), 'false');
    await reduce.click();
    assert.equal(await reduce.getAttribute('aria-pressed'), 'true');
    assert.equal(await page.evaluate(() => document.documentElement.getAttribute('data-motion-policy')), 'reduce');
    await reduce.click();
    assert.equal(await reduce.getAttribute('aria-pressed'), 'false');
    assert.equal(await page.evaluate(() => document.documentElement.hasAttribute('data-motion-policy')), false);
    assert.deepEqual(pageErrors, []);
    assert.deepEqual(motionErrors, []);
  } finally { await browser.close(); }
});

test(`${name}: the rail's Reduce motion button works on a non-motion page and keeps its choice through a client-side navigation`, async () => {
  const browser = await browserType.launch();
  try {
    const context = await browser.newContext({ javaScriptEnabled: true, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto(base + '/components/button/overview/');
    await waitForRail(page);
    const railButton = () => page.locator('.navigation-rail').getByRole('button', { name: 'Reduce motion', exact: true });
    assert.equal(await railButton().getAttribute('aria-pressed'), 'false');
    await railButton().click();
    assert.equal(await railButton().getAttribute('aria-pressed'), 'true');
    assert.equal(await page.evaluate(() => document.documentElement.getAttribute('data-motion-policy')), 'reduce');
    // Only a client-side navigation keeps this window and its marker: the choice must come along with the next page.
    await page.evaluate(() => {
      window.__motionPolicyMarker = true;
      document.addEventListener('astro:page-load', () => { window.__motionPolicyLoaded = true; }, { once: true });
    });
    await Promise.all([
      page.waitForFunction(() => location.pathname.startsWith('/get-started/introduction')),
      page.locator('a.navigation-rail-item[href="/get-started/introduction"]').click(),
    ]);
    await page.waitForFunction(() => window.__motionPolicyLoaded === true);
    assert.equal(await page.evaluate(() => window.__motionPolicyMarker), true, 'the navigation reloaded the page');
    assert.equal(await page.evaluate(() => document.documentElement.getAttribute('data-motion-policy')), 'reduce');
    assert.equal(await railButton().getAttribute('aria-pressed'), 'true');
    await railButton().click();
    assert.equal(await railButton().getAttribute('aria-pressed'), 'false');
    assert.equal(await page.evaluate(() => document.documentElement.hasAttribute('data-motion-policy')), false);
    assert.deepEqual(pageErrors, []);
  } finally { await browser.close(); }
});

test(`${name}: framework adapters play the exit before removing the card`, async () => {
  const browser = await browserType.launch();
  try {
    const context = await browser.newContext({ reducedMotion: 'no-preference' });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto(base + '/motion/presence/');
    for (const label of ['React', 'Angular', 'Svelte']) {
      const key = label.toLowerCase();
      const card = '[data-demo-card="' + key + '"]';
      // Selecting a framework shows its preview: the preview hydrates when it comes into view, and only then has its card.
      // The live example is the page's first code block; the others are code only.
      await page.locator('[aria-label="Example framework"]').first().getByRole('tab', { name: label, exact: true }).click();
      await page.locator(`[data-example-panel][data-framework="${key}"][data-view="preview"]`).scrollIntoViewIfNeeded();
      await page.waitForFunction(framework => {
        const island = document.querySelector(`[data-example-panel][data-framework="${framework}"][data-view="preview"] astro-island`);
        return !island || !island.hasAttribute('ssr');
      }, key, { timeout: 30000 });
      await page.waitForSelector(card);
      const toggle = page.getByRole('button', { name: 'Toggle ' + label + ' card', exact: true });
      await page.waitForFunction(selector => document.querySelector(selector)?.getAttribute('data-motion-presence') === 'present', card);
      // Recorded in the page: a framework may start the exit a task after the click.
      await page.evaluate(selector => {
        const element = document.querySelector(selector);
        window.__exitSeen = false;
        new MutationObserver(() => {
          if (element.isConnected && element.getAttribute('data-motion-presence') === 'exiting') window.__exitSeen = true;
        }).observe(element, { attributes: true, attributeFilter: ['data-motion-presence'] });
      }, card);
      await toggle.click();
      await page.waitForFunction(selector => document.querySelector(selector) === null, card);
      assert.equal(await page.evaluate(() => window.__exitSeen), true, label + ' card removed without playing its exit');
      await toggle.click();
      await page.waitForFunction(selector => document.querySelector(selector)?.getAttribute('data-motion-presence') === 'present', card);
    }
    assert.deepEqual(pageErrors, []);
  } finally { await browser.close(); }
});

test(`${name}: a need page is written for the chosen framework from its first paint, and follows a switch`, async () => {
  const browser = await browserType.launch();
  try {
    // The server renders every variant: React's shown, the others hidden.
    const html = await (await fetch(base + '/motion/presence/')).text();
    const variants = [...html.matchAll(/<(?:div|span|li)\b[^>]*\bdata-framework-variant="([^"]+)"[^>]*>/g)].map(([tag, frameworks]) => ({ frameworks, hidden: /\shidden(?:[\s>=])/.test(tag) }));
    for (const framework of ['html', 'react', 'angular', 'svelte']) {
      assert.ok(variants.some(variant => variant.frameworks.split(' ').includes(framework)), `no ${framework} variant in the server HTML`);
    }
    for (const variant of variants) assert.equal(variant.hidden, !variant.frameworks.split(' ').includes('react'), `server variant ${variant.frameworks}`);

    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    // The stored choice, and what every frame shows while the document is parsed: an animation frame callback runs before
    // its frame is painted. A frame may come before the parser has reached a variant (Firefox paints the page as it
    // arrives): it shows none, which is right; what must never be painted is another framework.
    await context.addInitScript(() => {
      localStorage.setItem('udixio:docs:preferred-example-framework', 'svelte');
      window.__frames = [];
      const sample = () => {
        window.__frames.push({
          parsed: document.readyState !== 'loading',
          root: document.documentElement.dataset.docsFramework,
          variants: [...document.querySelectorAll('[data-framework-variant]')].filter(el => getComputedStyle(el).display !== 'none').map(el => el.dataset.frameworkVariant),
          panels: [...document.querySelectorAll('[data-example-panel]')].filter(el => getComputedStyle(el).display !== 'none').map(el => el.dataset.framework),
          selected: [...document.querySelectorAll('[data-framework-choice][aria-selected="true"]')].map(el => el.dataset.frameworkChoice),
        });
        if (!window.__frames.at(-1).parsed) requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto(base + '/motion/presence/');
    await page.waitForFunction(() => window.__frames.at(-1)?.parsed === true);
    const frames = await page.evaluate(() => window.__frames);
    for (const frame of frames) {
      // A frame before the head script has run has nothing of the page's body either.
      assert.ok(frame.root === 'svelte' || (frame.variants.length === 0 && frame.panels.length === 0), `a frame has the root ${frame.root}`);
      for (const variant of frame.variants) assert.ok(variant.split(' ').includes('svelte'), `a frame shows the ${variant} variant`);
      for (const panel of frame.panels) assert.equal(panel, 'svelte', 'a frame shows a code block in another framework');
      if (frame.selected.length > 0) assert.deepEqual(frame.selected, ['svelte']);
    }
    const parsed = frames.at(-1);
    assert.ok(parsed.variants.length > 0, 'no variant was shown once the document was parsed');
    assert.deepEqual(parsed.selected, ['svelte'], 'the switch does not select Svelte once the document was parsed');

    /** What the page shows now: the root, the variants, the switch and the code blocks once their toolbars hydrated. */
    const shown = () => page.evaluate(() => ({
      root: document.documentElement.dataset.docsFramework,
      variants: [...new Set([...document.querySelectorAll('[data-framework-variant]:not([hidden])')].map(el => el.dataset.frameworkVariant))],
      selected: [...document.querySelectorAll('[data-framework-choice][aria-selected="true"]')].map(el => el.textContent.trim()),
      panels: [...new Set([...document.querySelectorAll('[data-example-panel]:not([hidden])')].map(el => el.dataset.framework))],
    }));
    // The header's switch changes the prose, the API names and every code block, once the islands have hydrated.
    await page.waitForFunction(() => document.querySelector('[data-code-ssr]') === null);
    const switcher = page.getByRole('tablist', { name: 'Written for' });
    await switcher.getByRole('tab', { name: 'Angular', exact: true }).click();
    await page.waitForFunction(() => [...document.querySelectorAll('[data-example-panel]:not([hidden])')].every(el => el.dataset.framework === 'angular'));
    assert.deepEqual(await shown(), { root: 'angular', variants: ['angular'], selected: ['Angular'], panels: ['angular'] });
    assert.equal(await page.evaluate(() => localStorage.getItem('udixio:docs:preferred-example-framework')), 'angular');
    // A code block's own tabs change the prose too: it is one choice for the site.
    await page.locator('[aria-label="Example framework"]').first().getByRole('tab', { name: 'HTML', exact: true }).click();
    await page.waitForFunction(() => document.documentElement.dataset.docsFramework === 'html');
    assert.deepEqual(await shown(), { root: 'html', variants: ['html'], selected: ['HTML'], panels: ['html'] });
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
    await page.goto(base + '/motion/layout/');
    await bringScene(page, '[data-motion-scene="resize"]', '[data-resize-row] > span');
    const pill = page.locator('[data-resize-row] > span');
    const oldLeft = await pill.evaluate(el => el.getBoundingClientRect().left);
    // Click and read in the page, in one task: the move has just started and the pill is still where it was.
    const started = await page.evaluate(async () => {
      const element = document.querySelector('[data-resize-row] > span');
      document.querySelector('[data-resize-align]').click();
      await Promise.resolve();
      return { animations: element.getAnimations().length, left: element.getBoundingClientRect().left };
    });
    assert.ok(started.animations >= 1, 'the pill has no move in flight');
    assert.ok(Math.abs(started.left - oldLeft) < 2, `the pill jumped from ${oldLeft} to ${started.left}`);
    await page.waitForFunction(() => document.querySelector('[data-resize-row] > span').getAnimations().length === 0);
    const ended = await pill.evaluate(el => ({ left: el.getBoundingClientRect().left, translate: el.style.translate, scale: el.style.scale }));
    assert.ok(ended.left > oldLeft + 40, `the pill ended at ${ended.left}, it started at ${oldLeft}`);
    assert.equal(ended.translate, '');
    assert.equal(ended.scale, '');

    await page.locator('[data-resize-rotate]').click();
    const items = '[data-resize-list] > li';
    await page.waitForFunction(selector => [...document.querySelectorAll(selector)].some(el => el.getAnimations().length > 0), items);
    await page.waitForFunction(selector => [...document.querySelectorAll(selector)].every(el => el.getAnimations().length === 0), items);
    const order = await page.evaluate(selector => {
      const elements = [...document.querySelectorAll(selector)];
      const dom = elements.map(el => el.textContent.trim());
      const visual = [...elements].sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top).map(el => el.textContent.trim());
      return { dom, visual };
    }, items);
    assert.deepEqual(order.visual, order.dom);
    assert.equal(order.dom[0], 'Review');

    // Size: the content of a card keeps its shape while the card grows.
    const measureSize = () => {
      const card = document.querySelector('[data-resize-card]').getBoundingClientRect();
      const chip = document.querySelector('[data-resize-card] span[data-motion="reflow"]').getBoundingClientRect();
      return { cardWidth: card.width, chipWidth: chip.width, chipHeight: chip.height, chipGap: card.right - chip.right };
    };
    const rest = await page.evaluate(measureSize);
    await page.locator('[data-resize-widen]').click();
    // Every animation of the scene is held at the same moment, halfway through the move.
    await page.evaluate(() => {
      for (const animation of document.querySelector('[data-resize-scene]').getAnimations({ subtree: true })) {
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
      for (const animation of document.querySelector('[data-resize-scene]').getAnimations({ subtree: true })) animation.play();
    });
    await page.waitForFunction(() => document.querySelector('[data-resize-scene]').getAnimations({ subtree: true }).length === 0);
    const final = await page.evaluate(measureSize);
    assert.ok(Math.abs(middle.cardWidth - final.cardWidth) > 5, `the card was ${middle.cardWidth}px wide mid-move and ${final.cardWidth}px at the end`);
    assert.equal(await page.evaluate(() => [...document.querySelectorAll('[data-resize-scene] *')].some(el => el.style.translate !== '' || el.style.scale !== '')), false);
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
      page.waitForURL('**/motion/glossary/'),
      page.getByRole('navigation', { name: 'Animation documentation' }).getByRole('link', { name: 'Glossary' }).click(),
    ]);
    assert.equal(await page.evaluate(() => window.__dir), 'forward');
    await page.evaluate(() => { window.__dir = undefined; history.back(); });
    await page.waitForFunction(() => window.__dir !== undefined);
    assert.equal(await page.evaluate(() => window.__dir), 'back');
  } finally { await browser.close(); }
});

test(`${name}: a list's new items cascade from the chosen origin, and the list keeps its height`, async () => {
  const browser = await browserType.launch();
  try {
    const context = await browser.newContext({ javaScriptEnabled: true, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto(base + '/motion/lists/');
    await bringScene(page, '[data-motion-scene="inbox"]', '[data-inbox-list] > li');
    const items = '[data-inbox-list] > li';
    const count = () => page.locator(items).count();
    const names = () => page.evaluate(selector => [...document.querySelectorAll(selector)].map(el => el.querySelector('.truncate.text-title-small').textContent.trim()), items);
    const waitForRest = () => page.waitForFunction(() => [...document.querySelectorAll('[data-inbox-list] *')].every(el => el.getAnimations().length === 0));
    // The items in DOM order and in visual order (by top), and the gaps between consecutive boxes.
    const layout = () => page.evaluate(selector => {
      const elements = [...document.querySelectorAll(selector)];
      const dom = elements.map(el => el.textContent.trim());
      const visual = [...elements].sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top).map(el => el.textContent.trim());
      const boxes = elements.map(el => el.getBoundingClientRect());
      const gaps = boxes.slice(1).map((box, index) => box.top - boxes[index].bottom);
      return { dom, visual, gaps };
    }, items);
    const listHeight = () => page.locator('[data-inbox-list]').evaluate(el => el.getBoundingClientRect().height);
    assert.equal(await count(), 5);
    const heightAtRest = await listHeight();
    assert.deepEqual(await names(), ['Kai', 'Ines', 'Mo', 'Lin', 'Ada']);

    // Origin Center, then Add three: the three new items enter in one task, and the middle one starts first.
    await page.locator('[data-inbox-origin="center"]').click();
    await page.locator('[data-inbox-add="3"]').click();
    const delays = await page.evaluate(selector => [...document.querySelectorAll(selector)].slice(0, 3).map(el => {
      const values = el.getAnimations().map(animation => animation.effect.getTiming().delay);
      return values.length > 0 ? Math.max(...values) : null;
    }), items);
    assert.equal(delays[1], 0, 'the middle item does not start first');
    assert.ok(Math.abs(delays[0] - 50) <= 1 && Math.abs(delays[2] - 50) <= 1, `the neighbours start at ${delays[0]} and ${delays[2]} ms, expected 50`);
    await page.waitForFunction(selector => [...document.querySelectorAll(selector)].slice(0, 3).every(el => el.getAttribute('data-motion-presence') === 'present'), items);
    await waitForRest();
    // The three oldest messages leave out of the flow: the list keeps five rows, and its height does not change.
    assert.equal(await count(), 5);
    assert.deepEqual((await names()).slice(0, 3), ['Zoé', 'Noor', 'Theo']);
    assert.equal(await listHeight(), heightAtRest);
    let order = await layout();
    assert.deepEqual(order.visual, order.dom);
    for (const gap of order.gaps) assert.ok(Math.abs(gap - 8) <= 1, `gap of ${gap}px between list items`);

    // Delete on the focused first message: it leaves, and the list closes up with the 8 px gap of gap-2.
    await page.locator(items).first().focus();
    await page.keyboard.press('Delete');
    await page.waitForFunction(([selector, expected]) => document.querySelectorAll(selector).length === expected, [items, 4]);
    await waitForRest();
    assert.deepEqual(await names(), ['Noor', 'Theo', 'Kai', 'Ines']);
    order = await layout();
    assert.deepEqual(order.visual, order.dom);
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
    await page.goto(base + '/motion/shared-elements/');
    const thumb = '[data-gallery-thumb][data-motion-shared="shape-1"]';
    await bringScene(page, '[data-motion-scene="gallery"]', thumb);
    // Page coordinates, so that a scroll between two reads does not count as a move.
    const initial = await page.evaluate(selector => {
      const rect = document.querySelector(selector).getBoundingClientRect();
      return { left: rect.left, top: rect.top + window.scrollY, width: rect.width, height: rect.height };
    }, thumb);

    // Open: click and read in one task. The detail has just started from where the thumbnail was.
    const opened = await page.evaluate(async selector => {
      const thumbEl = document.querySelector(selector);
      const from = thumbEl.getBoundingClientRect();
      thumbEl.click();
      await Promise.resolve();
      const detail = document.getElementById('gallery-detail');
      const to = detail.getBoundingClientRect();
      return {
        animations: detail.getAnimations().length,
        from: { left: from.left, top: from.top, width: from.width, height: from.height },
        to: { left: to.left, top: to.top, width: to.width, height: to.height },
      };
    }, thumb);
    assert.ok(opened.animations >= 1, 'the detail has no morph in flight');
    for (const key of ['left', 'top', 'width', 'height'])
      assert.ok(Math.abs(opened.to[key] - opened.from[key]) <= 2, `the detail's ${key} is ${opened.to[key]}, the thumbnail's is ${opened.from[key]}`);
    await page.waitForFunction(() => document.getElementById('gallery-detail').getAnimations().length === 0);
    const shown = await page.evaluate(selector => {
      const detail = document.getElementById('gallery-detail');
      return {
        hidden: detail.hidden,
        display: getComputedStyle(detail).display,
        width: detail.getBoundingClientRect().width,
        thumbHidden: document.querySelector(selector).hidden,
        translate: detail.style.translate,
        scale: detail.style.scale,
        borderRadius: detail.style.borderRadius,
      };
    }, thumb);
    assert.equal(shown.hidden, false);
    assert.notEqual(shown.display, 'none');
    assert.ok(shown.width > 200, `the detail is ${shown.width}px wide`);
    assert.equal(shown.thumbHidden, true);
    assert.equal(shown.translate, '');
    assert.equal(shown.scale, '');
    assert.equal(shown.borderRadius, '');

    // Close: click and read in one task. The thumbnail has just started from where the detail was.
    const closing = await page.evaluate(async selector => {
      const detail = document.getElementById('gallery-detail');
      const from = detail.getBoundingClientRect();
      document.querySelector('[data-gallery-close]').click();
      await Promise.resolve();
      const thumbEl = document.querySelector(selector);
      const to = thumbEl.getBoundingClientRect();
      return {
        animations: thumbEl.getAnimations().length,
        from: { left: from.left, top: from.top, width: from.width, height: from.height },
        to: { left: to.left, top: to.top, width: to.width, height: to.height },
      };
    }, thumb);
    assert.ok(closing.animations >= 1, 'the thumbnail has no morph in flight');
    for (const key of ['left', 'top', 'width', 'height'])
      assert.ok(Math.abs(closing.to[key] - closing.from[key]) <= 2, `the thumbnail's ${key} is ${closing.to[key]}, the detail's is ${closing.from[key]}`);
    await page.waitForFunction(selector => document.querySelector(selector).getAnimations().length === 0, thumb);
    const back = await page.evaluate(selector => {
      const rect = document.querySelector(selector).getBoundingClientRect();
      return { left: rect.left, top: rect.top + window.scrollY, width: rect.width, height: rect.height, detailHidden: document.getElementById('gallery-detail').hidden };
    }, thumb);
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
    await page.goto(base + '/motion/reveal/');
    const feed = '[data-reveal-feed]';
    const cards = '[data-reveal-feed] > li';
    await bringScene(page, '[data-motion-scene="reveal"]', '[data-reveal-feed] > li[data-motion]');
    // The feed scrolls: the cards below its visible part are in their first frame.
    const atLoad = await page.evaluate(([feedSelector, cardSelector]) => {
      const bottom = document.querySelector(feedSelector).getBoundingClientRect().bottom;
      return [...document.querySelectorAll(cardSelector)].map(el => ({
        below: el.getBoundingClientRect().top >= bottom,
        opacity: getComputedStyle(el).opacity,
      }));
    }, [feed, cards]);
    assert.equal(atLoad.length, 10);
    for (const card of atLoad.filter(card => card.below)) assert.equal(card.opacity, '0', 'a card below the feed is not in its first frame');
    assert.ok(atLoad.some(card => card.below), 'every card of the feed is in view at load');
    // Scroll the feed by a third of its height at a time, so that every card is in view at some step of the scroll.
    await page.evaluate(async selector => {
      const frames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const box = document.querySelector(selector);
      const step = box.clientHeight / 3;
      for (let y = box.scrollTop; ; y = Math.min(y + step, box.scrollHeight)) {
        box.scrollTop = y;
        await frames();
        if (y >= box.scrollHeight - box.clientHeight) break;
      }
    }, feed);
    await page.waitForFunction(selector => [...document.querySelectorAll(selector)].every(el => el.getAnimations().length === 0), cards);
    const after = await page.evaluate(selector => [...document.querySelectorAll(selector)].map(el => ({
      opacity: getComputedStyle(el).opacity,
      translate: getComputedStyle(el).translate,
    })), cards);
    assert.equal(after.length, 10);
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
    await page.goto(base + '/motion/scrub/');
    const tile = '[data-thread-scene] [data-motion="parallax"]';
    await bringScene(page, '[data-motion-scene="thread"]', tile);
    // The top edge of the tile at 80 %, then at 20 %, of the viewport height: two frames after each scroll.
    const { native, low, high } = await page.evaluate(async selector => {
      const frames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const element = document.querySelector(selector);
      const pageTop = element.getBoundingClientRect().top + window.scrollY;
      const at = async fraction => {
        window.scrollTo(0, pageTop - fraction * window.innerHeight);
        await frames();
        return getComputedStyle(element).translate;
      };
      const lowValue = await at(0.8);
      const highValue = await at(0.2);
      return { native: typeof ViewTimeline === 'function', low: lowValue, high: highValue };
    }, tile);
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
    await page.goto(base + '/motion/loop/');
    const loops = '[data-loop-pausable]';
    await bringScene(page, '[data-motion-scene="loop"]', loops);
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
    await page.goto(base + '/motion/values/');
    await bringScene(page, '[data-motion-scene="pointer"]', '[data-pointer-card]');
    // The pointer at 75 % of the card's width and at its middle height: the x value goes to 4 (the range is -8 to 8).
    await page.evaluate(() => {
      const card = document.querySelector('[data-pointer-card]');
      const box = card.getBoundingClientRect();
      card.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: box.left + box.width * 0.75, clientY: box.top + box.height / 2 }));
    });
    await page.waitForFunction(() => Math.abs(Number(getComputedStyle(document.querySelector('[data-pointer-card]')).getPropertyValue('--udx-motion-value-pointer-tilt-x')) - 4) < 0.2);
    const tiltX = await page.evaluate(() => Number(getComputedStyle(document.querySelector('[data-pointer-card]')).getPropertyValue('--udx-motion-value-pointer-tilt-x')));
    assert.ok(Math.abs(tiltX - 4) < 0.2, `the tilt is ${tiltX} at 75 % of the card, expected 4`);
    // Half of the scrollable height is half of the scroll progress.
    await page.evaluate(() => window.scrollTo(0, (document.documentElement.scrollHeight - window.innerHeight) / 2));
    await page.waitForFunction(() => Math.abs(Number(getComputedStyle(document.querySelector('[data-pointer-reading]')).getPropertyValue('--udx-motion-value-pointer-reading')) - 0.5) < 0.05);
    const reading = await page.evaluate(() => Number(getComputedStyle(document.querySelector('[data-pointer-reading]')).getPropertyValue('--udx-motion-value-pointer-reading')));
    assert.ok(Math.abs(reading - 0.5) < 0.05, `the scroll progress is ${reading}, expected 0.5`);
    assert.deepEqual(pageErrors, []);
  } finally { await browser.close(); }
});

test(`${name}: counters count to their numbers, and read in the language of the group`, async () => {
  const browser = await browserType.launch();
  try {
    const context = await browser.newContext({ javaScriptEnabled: true, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto(base + '/motion/values/');
    const visitors = '[data-counters-scene] [data-counter="counter-visitors"]';
    await bringScene(page, '[data-motion-scene="counters"]', visitors);
    const formatted = (locale, value) => page.evaluate(([tag, number]) => new Intl.NumberFormat(tag, { maximumFractionDigits: 0 }).format(number), [locale, value]);
    // A counter ends as one text node holding its number.
    const single = async text => page.waitForFunction(([selector, expected]) => {
      const element = document.querySelector(selector);
      return element !== null && element.childNodes.length === 1 && element.firstChild.nodeType === Node.TEXT_NODE && element.textContent === expected;
    }, [visitors, text]);
    // The numbers take the format of the group's language; the page starts in English.
    await single(await formatted('en', 12480));
    await page.getByRole('button', { name: 'Add 1,000', exact: true }).click();
    await single(await formatted('en', 13480));
    assert.equal(await page.locator(visitors).getAttribute('value'), '13480');
    await page.getByRole('button', { name: 'fr', exact: true }).click();
    await single(await formatted('fr', 13480));
    await page.getByRole('button', { name: 'en', exact: true }).click();
    await single(await formatted('en', 13480));
    assert.deepEqual(pageErrors, []);
  } finally { await browser.close(); }
});

test(`${name}: a sequence plays its steps in order`, async () => {
  const browser = await browserType.launch();
  try {
    const context = await browser.newContext({ javaScriptEnabled: true, reducedMotion: 'no-preference' });
    // The steps are played at once, each with its delay, and most finish before a test can read them: each animation of a
    // step is recorded when it is created, with its delay and duration.
    await context.addInitScript(() => {
      window.__steps = [];
      const animate = Element.prototype.animate;
      Element.prototype.animate = function (keyframes, options) {
        const animation = animate.call(this, keyframes, options);
        const step = this.closest('[data-launch-scene] [data-motion-step]');
        if (step) {
          const timing = animation.effect.getTiming();
          const same = [...document.querySelectorAll('[data-launch-scene] [data-motion-step="' + step.dataset.motionStep + '"]')];
          window.__steps.push({ step: step.dataset.motionStep, element: same.indexOf(step), delay: timing.delay, duration: timing.duration });
        }
        return animation;
      };
    });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto(base + '/motion/sequences/');
    await bringScene(page, '[data-motion-scene="launch"]', '[data-launch-scene] [data-motion-step="title"]');
    await page.waitForFunction(() => document.querySelector('[data-launch-scene]').getAnimations({ subtree: true }).length === 0, null, { timeout: 20000 });
    const steps = await page.evaluate(() => window.__steps);
    // The first delay of each step, and the end of its last animation: a step starts when its token says and ends with its last element.
    const span = name => {
      const of = steps.filter(entry => entry.step === name);
      assert.ok(of.length > 0, `the step ${name} was not played`);
      return { start: Math.min(...of.map(entry => entry.delay)), end: Math.max(...of.map(entry => entry.delay + entry.duration)) };
    };
    const kicker = span('kicker');
    const title = span('title');
    const chart = span('chart');
    assert.equal(kicker.start, 0, 'the kicker does not start at once');
    // +=normal: the title starts one normal stagger (50 ms) after the kicker starts, not after it ends.
    assert.equal(title.start, 50, `the title starts at ${title.start} ms, expected 50`);
    // at: 'title': the chart starts with the title.
    assert.equal(chart.start, title.start, 'the chart does not start with the title');
    // A step without a token starts when the one before it has ended; the two stats are loose apart (100 ms).
    const stats = [0, 1].map(index => Math.min(...steps.filter(entry => entry.step === 'stats' && entry.element === index).map(entry => entry.delay)));
    assert.equal(stats[0], chart.end, `the stats start at ${stats[0]} ms, the chart ends at ${chart.end} ms`);
    assert.ok(Math.abs(stats[1] - stats[0] - 100) <= 1, `the second stat starts ${stats[1] - stats[0]} ms after the first, expected 100 (loose)`);
    const opacities = await page.evaluate(() => [...document.querySelectorAll('[data-launch-scene] [data-motion-step="title"]')].map(element => getComputedStyle(element).opacity));
    assert.deepEqual(opacities, ['1']);
    assert.deepEqual(pageErrors, []);
  } finally { await browser.close(); }
});

test(`${name}: a sticker can be dragged and nudged with the keyboard`, async () => {
  const browser = await browserType.launch();
  try {
    const context = await browser.newContext({ javaScriptEnabled: true, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto(base + '/motion/gestures/');
    const sticker = page.locator('[data-gestures-sticker]');
    const board = page.locator('[data-gestures-scene]');
    await bringScene(page, '[data-motion-scene="gestures"]', '[data-gestures-sticker]');
    await board.scrollIntoViewIfNeeded();
    // A release is over when the sticker reports motion-dragend: it fires once the spring is at rest. Two equal frames are not
    // enough, as the release frame and the one before it can show the same translate.
    const armDragEnd = () => page.evaluate(() => {
      window.__dragEnded = false;
      document.querySelector('[data-gestures-sticker]').addEventListener('motion-dragend', () => { window.__dragEnded = true; }, { once: true });
    });
    const before = await sticker.boundingBox();
    const areaBox = await board.boundingBox();
    const centre = { x: before.x + before.width / 2, y: before.y + before.height / 2 };
    await page.mouse.move(centre.x, centre.y);
    await page.mouse.down();
    await page.mouse.move(centre.x + 120, centre.y + 40, { steps: 6 });
    await armDragEnd();
    await page.mouse.up();
    await page.waitForFunction(() => window.__dragEnded);
    const dragged = await sticker.boundingBox();
    assert.ok(dragged.x - before.x >= 100, `the sticker moved ${dragged.x - before.x} px, expected at least 100`);
    assert.ok(dragged.x >= areaBox.x && dragged.x + dragged.width <= areaBox.x + areaBox.width, 'the sticker is outside the board on the x axis');
    assert.ok(dragged.y >= areaBox.y && dragged.y + dragged.height <= areaBox.y + areaBox.height, 'the sticker is outside the board on the y axis');
    // Focused, one press of ArrowLeft moves the sticker 16 px to the left.
    await sticker.focus();
    const beforeKey = await sticker.boundingBox();
    // The nudge is written in the keydown, without a release.
    await page.keyboard.press('ArrowLeft');
    const afterKey = await sticker.boundingBox();
    assert.ok(Math.abs(beforeKey.x - afterKey.x - 16) <= 1, `the sticker moved ${beforeKey.x - afterKey.x} px left, expected 16`);
    assert.deepEqual(pageErrors, []);
  } finally { await browser.close(); }
});

test(`${name}: a notification is swiped away and the list closes up`, async () => {
  const browser = await browserType.launch();
  try {
    const context = await browser.newContext({ javaScriptEnabled: true, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto(base + '/motion/lists/');
    const items = '[data-inbox-list] > li';
    await bringScene(page, '[data-motion-scene="inbox"]', items);
    const count = () => page.locator(items).count();
    const names = () => page.evaluate(selector => [...document.querySelectorAll(selector)].map(el => el.querySelector('.truncate.text-title-small').textContent.trim()), items);
    const waitForRest = () => page.waitForFunction(() => [...document.querySelectorAll('[data-inbox-list] *')].every(el => el.getAnimations().length === 0));
    // The items in DOM order and in visual order (by top), and the gaps between consecutive boxes.
    const layout = () => page.evaluate(selector => {
      const elements = [...document.querySelectorAll(selector)];
      const dom = elements.map(el => el.textContent.trim());
      const visual = [...elements].sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top).map(el => el.textContent.trim());
      const boxes = elements.map(el => el.getBoundingClientRect());
      const gaps = boxes.slice(1).map((box, index) => box.top - boxes[index].bottom);
      return { dom, visual, gaps };
    }, items);
    assert.equal(await count(), 5);

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
    await page.waitForFunction(([selector, expected]) => document.querySelectorAll(selector).length === expected, [items, 4]);
    await waitForRest();
    let order = await layout();
    assert.deepEqual(await names(), ['Ines', 'Mo', 'Lin', 'Ada']);
    assert.deepEqual(order.visual, order.dom);
    for (const gap of order.gaps) assert.ok(Math.abs(gap - 8) <= 1, `gap of ${gap}px between list items`);

    // Focused, Delete swipes the new first item away too.
    await page.locator(items).first().focus();
    await page.keyboard.press('Delete');
    await page.waitForFunction(([selector, expected]) => document.querySelectorAll(selector).length === expected, [items, 3]);
    assert.deepEqual(await names(), ['Mo', 'Lin', 'Ada']);
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
    await page.goto(base + '/motion/gestures/');
    const tasks = '[data-gestures-list] > li';
    await bringScene(page, '[data-motion-scene="gestures"]', tasks);
    // Space grabs the second task, ArrowDown moves it past the third, and Space drops it.
    await page.locator(tasks, { hasText: 'Ship the release notes' }).focus();
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Space');
    const names = () => page.evaluate(selector => [...document.querySelectorAll(selector)].map(el => el.textContent.trim()), tasks);
    assert.deepEqual(await names(), ['Reply to the design review', 'Book the room for Friday', 'Ship the release notes']);
    assert.equal(await page.locator('[data-udx-motion-live]').textContent(), 'Dropped. Position 3 of 3.');
    await page.waitForFunction(() => [...document.querySelectorAll('[data-gestures-list] *')].every(el => el.getAnimations().length === 0));
    const visual = await page.evaluate(selector => [...document.querySelectorAll(selector)].sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top).map(el => el.textContent.trim()), tasks);
    assert.deepEqual(visual, await names());
    assert.deepEqual(pageErrors, []);
  } finally { await browser.close(); }
});

test(`${name}: a sentence is revealed word by word, and read once`, async () => {
  const browser = await browserType.launch();
  try {
        // A sentence in view when it is bound keeps its natural state, as the library does not play content already in view: the
    // window is short, so that the sentence is below the fold at load, in its first frame.
    const context = await browser.newContext({ javaScriptEnabled: true, reducedMotion: 'no-preference', viewport: { width: 1280, height: 500 } });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto(base + '/motion/text/');
    const heading = '[data-text-line]';
    await page.waitForSelector(heading);
    // The reveal is bound at connect: wait for the page to be quiet, then for the sentence to hold its first frame.
    await page.waitForLoadState('networkidle');
    await expectHeldBelowFold(page, heading);
    await expectWordsPlayed(page, heading, ['Every', 'word', 'arrives', 'in', 'turn,', 'and', 'is', 'read', 'once.'], 'Every word arrives in turn, and is read once.');
    assert.deepEqual(pageErrors, []);
  } finally { await browser.close(); }
});

test(`${name}: a sentence reached by a client navigation holds its first frame before it is in view`, async () => {
  const browser = await browserType.launch();
  try {
        // A sentence in view when it is bound keeps its natural state, as the library does not play content already in view: the
    // window is short, so that the sentence is below the fold at load, in its first frame.
    const context = await browser.newContext({ javaScriptEnabled: true, reducedMotion: 'no-preference', viewport: { width: 1280, height: 500 } });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    const heading = '[data-text-line]';
    const navigation = page.getByRole('navigation', { name: 'Animation documentation' });
    await page.goto(base + '/motion/text/');
    await page.waitForSelector(heading);
    await page.waitForLoadState('networkidle');
    // The first visit loads the text module: the client navigation back binds the sentence with the module already there.
    await navigation.getByRole('link', { name: 'Glossary' }).click();
    await page.waitForFunction(() => location.pathname.startsWith('/motion/glossary'));
    // Back to the text page through the router's history. The forward page settles first: a back navigation fired at once
    // after a client navigation throws React #424 on WebKit (an @astrojs/react issue), and the test must not hide it.
    await page.waitForTimeout(1200);
    await page.goBack();
    await page.waitForFunction(() => location.pathname.startsWith('/motion/text'));
    await page.waitForSelector(heading);
    await page.waitForLoadState('networkidle');
    await expectHeldBelowFold(page, heading);
    await expectWordsPlayed(page, heading, ['Every', 'word', 'arrives', 'in', 'turn,', 'and', 'is', 'read', 'once.'], 'Every word arrives in turn, and is read once.');
    assert.deepEqual(pageErrors, []);
  } finally { await browser.close(); }
});

test(`${name}: a check is drawn again, a dot travels again, and a shape morphs into another`, async () => {
  const browser = await browserType.launch();
  try {
    const context = await browser.newContext({ javaScriptEnabled: true, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto(base + '/motion/svg/');
    await bringScene(page, '[data-motion-scene="svg"]', '[data-svg-travel]');
    await page.waitForFunction(() => document.querySelector('[data-svg-travel]').getAnimations().length === 0 && document.querySelector('[data-svg-check]').getAnimations().length === 0, null, { timeout: 20000 });
    // The dot rests at the end of its track, where its entry ends.
    assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('[data-svg-travel]')).offsetDistance), '100%');

    // Draw again: the check is in flight in the same task as the click, and at rest the stroke is whole, with no dash inline.
    const drawing = await page.evaluate(async () => {
      document.querySelector('[data-svg-draw-again]').click();
      await Promise.resolve();
      return document.querySelector('[data-svg-check]').getAnimations().length;
    });
    assert.ok(drawing >= 1, 'the check is not drawn again');
    await page.waitForFunction(() => document.querySelector('[data-svg-check]').getAnimations().length === 0, null, { timeout: 20000 });
    const drawn = await page.evaluate(() => {
      const path = document.querySelector('[data-svg-check]');
      return { offset: parseFloat(getComputedStyle(path).strokeDashoffset), dash: path.style.strokeDasharray, inlineOffset: path.style.strokeDashoffset };
    });
    assert.ok(Math.abs(drawn.offset) <= 0.001, `the stroke ends at dash offset ${drawn.offset}, expected 0`);
    assert.equal(drawn.dash, '');
    assert.equal(drawn.inlineOffset, '');

    // Move again: the dot leaves its end, then comes back to it.
    const moving = await page.evaluate(async () => {
      document.querySelector('[data-svg-move-again]').click();
      await Promise.resolve();
      return document.querySelector('[data-svg-travel]').getAnimations().length;
    });
    assert.ok(moving >= 1, 'the dot does not travel again');
    await page.waitForFunction(() => document.querySelector('[data-svg-travel]').getAnimations().length === 0, null, { timeout: 20000 });
    assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('[data-svg-travel]')).offsetDistance), '100%');

    // Morph: the icon becomes the Flower shape, its button is pressed, and the morph leaves no path behind.
    const icon = page.locator('[data-svg-morph]');
    const paths = () => page.evaluate(() => document.querySelector('[data-svg-morph]').closest('svg').querySelectorAll('path').length);
    const pathsBefore = await paths();
    const flower = await page.evaluate(() => document.querySelector('[data-svg-target="Flower"]').getAttribute('d'));
    await page.locator('[data-svg-shape="Flower"]').click();
    await page.waitForFunction(target => document.querySelector('[data-svg-morph]').getAttribute('d') === target, flower, { timeout: 20000 });
    assert.equal(await icon.getAttribute('d'), flower);
    assert.equal(await page.locator('[data-svg-shape="Flower"]').getAttribute('aria-pressed'), 'true');
    assert.equal(await paths(), pathsBefore, 'the morph left a path behind');
    assert.deepEqual(pageErrors, []);
  } finally { await browser.close(); }
});

test(`${name}: a scroll takes its box to the section, and focuses its heading`, async () => {
  const browser = await browserType.launch();
  try {
    const context = await browser.newContext({ javaScriptEnabled: true, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto(base + '/motion/scroll/');
    const box = '[data-scroll-box]';
    await bringScene(page, '[data-motion-scene="scroll"]', box);
    assert.equal(await page.evaluate(selector => document.querySelector(selector).scrollTop, box), 0);
    await page.locator('[data-scroll-go="scroll-section-3"]').click();
    // The scroll is over when the section holds the focus, and its top is level with the top of the box.
    await page.waitForFunction(() => {
      const section = document.getElementById('scroll-section-3');
      const frame = document.querySelector('[data-scroll-box]').getBoundingClientRect();
      return document.activeElement === section && Math.abs(section.getBoundingClientRect().top - frame.top) <= 2;
    }, null, { timeout: 20000 });
    const after = await page.evaluate(() => {
      const section = document.getElementById('scroll-section-3');
      const frame = document.querySelector('[data-scroll-box]');
      return { scrollTop: frame.scrollTop, offset: section.getBoundingClientRect().top - frame.getBoundingClientRect().top, focused: document.activeElement === section };
    });
    assert.ok(after.scrollTop > 0, 'the box did not scroll');
    assert.ok(Math.abs(after.offset) <= 2, `the section is ${after.offset} px from the top of the box`);
    assert.equal(after.focused, true);
    assert.deepEqual(pageErrors, []);
  } finally { await browser.close(); }
});
}
