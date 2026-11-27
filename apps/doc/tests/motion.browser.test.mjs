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
    // The policy is CSS alone: the attribute on <html> sets the scale that every motion reads, with JavaScript off.
    const scale = () => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--udx-motion-scale').trim());
    for (const [policy, expected] of [['reduce', '0'], ['auto', '1'], ['unknown', '1'], ['', '1']]) {
      await page.evaluate(value => value ? document.documentElement.setAttribute('data-motion-policy', value) : document.documentElement.removeAttribute('data-motion-policy'), policy);
      assert.equal(await scale(), expected, `data-motion-policy="${policy}"`);
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
    assert.equal(await scale(), '0');
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

test(`${name}: the HTML toast of the presence page enters and leaves with hidden, Undo dismisses it, and the rail's Reduce motion button sets the policy`, async () => {
  const browser = await browserType.launch();
  try {
    const context = await browser.newContext({ reducedMotion: 'no-preference' });
    // The page written for HTML: its demo's preview is the HTML example itself (HtmlExample.astro).
    await context.addInitScript(() => localStorage.setItem('udixio:docs:preferred-example-framework', 'html'));
    const page = await context.newPage();
    const pageErrors = [];
    const motionErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error' && message.text().includes('@udixio/motion')) motionErrors.push(message.text());
    });
    await page.goto(base + '/motion/presence/');
    const toast = page.locator('#saved-toast');
    assert.equal(await toast.evaluate(el => el.hidden), true, 'the toast is shown before Save');
    // Recorded in the page: the display of the toast once it is hidden and inert, while its exit plays.
    await page.evaluate(() => {
      const element = document.getElementById('saved-toast');
      window.__exitDisplay = null;
      new MutationObserver(() => {
        if (element.hidden && element.hasAttribute('inert') && window.__exitDisplay === null) window.__exitDisplay = getComputedStyle(element).display;
      }).observe(element, { attributes: true, attributeFilter: ['hidden', 'inert'] });
    });
    await page.locator('#save').click();
    await page.waitForFunction(() => {
      const element = document.getElementById('saved-toast');
      return element.getAttribute('data-motion-presence') === 'present' && !element.hidden && !element.hasAttribute('inert');
    });
    assert.equal(await toast.evaluate(el => getComputedStyle(el).opacity), '1');
    // It leaves by itself four seconds later: its exit plays while it is still displayed, then hidden hides it.
    await page.waitForFunction(() => getComputedStyle(document.getElementById('saved-toast')).display === 'none', null, { timeout: 10000 });
    const exitDisplay = await page.evaluate(() => window.__exitDisplay);
    assert.ok(exitDisplay !== null && exitDisplay !== 'none', `the toast was not displayed during its exit (${exitDisplay})`);
    assert.equal(await toast.evaluate(el => el.hidden), true);
    // Undo dismisses it at once, long before its four seconds.
    await page.locator('#save').click();
    await page.waitForFunction(() => document.getElementById('saved-toast').getAttribute('data-motion-presence') === 'present');
    await page.locator('#undo').click();
    assert.equal(await toast.evaluate(el => el.hidden), true, 'Undo did not hide the toast');
    await page.waitForFunction(() => getComputedStyle(document.getElementById('saved-toast')).display === 'none', null, { timeout: 2000 });
    await page.locator('#save').click();
    await page.waitForFunction(() => document.getElementById('saved-toast').getAttribute('data-motion-presence') === 'present');
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

test(`${name}: framework adapters play the toast's exit before removing it, and Undo removes it at once`, async () => {
  const browser = await browserType.launch();
  try {
    const context = await browser.newContext({ reducedMotion: 'no-preference' });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto(base + '/motion/presence/');
    for (const label of ['React', 'Angular', 'Svelte']) {
      const key = label.toLowerCase();
      const panel = `[data-example-panel][data-framework="${key}"][data-view="preview"]`;
      const toast = `${panel} [role="status"] [data-motion-presence]`;
      // Selecting a framework shows its preview: the preview hydrates when it comes into view. The demo is the page's
      // first code block, its code and its preview side by side; the preview is as tall as the code, its example at the
      // top: the top of the preview is brought into view (scrollIntoViewIfNeeded would centre the tall cell).
      await page.locator('[aria-label="Example framework"]').first().getByRole('tab', { name: label, exact: true }).click();
      await page.locator(panel).evaluate(element => element.scrollIntoView({ block: 'start' }));
      await page.waitForFunction(selector => {
        const island = document.querySelector(`${selector} astro-island`);
        return !island || !island.hasAttribute('ssr');
      }, panel, { timeout: 30000 });
      assert.equal(await page.locator(`[data-example-panel][data-framework="${key}"][data-view="code"]`).first().isVisible(), true, `${label}: the code is not shown beside its preview`);
      const save = page.locator(panel).getByRole('button', { name: 'Save to library', exact: true });
      await save.click();
      await page.waitForFunction(selector => document.querySelector(selector)?.getAttribute('data-motion-presence') === 'present', toast);
      // Recorded in the page: a framework may start the exit a task after the timer.
      await page.evaluate(selector => {
        const element = document.querySelector(selector);
        window.__exitSeen = false;
        new MutationObserver(() => {
          if (element.isConnected && element.getAttribute('data-motion-presence') === 'exiting') window.__exitSeen = true;
        }).observe(element, { attributes: true, attributeFilter: ['data-motion-presence'] });
      }, toast);
      // The toast leaves by itself four seconds after it was shown.
      await page.waitForFunction(selector => document.querySelector(selector) === null, toast, { timeout: 10000 });
      assert.equal(await page.evaluate(() => window.__exitSeen), true, label + ' toast removed without playing its exit');
      // Undo dismisses it at once, long before its four seconds.
      await save.click();
      await page.waitForFunction(selector => document.querySelector(selector)?.getAttribute('data-motion-presence') === 'present', toast);
      await page.locator(panel).getByRole('button', { name: 'Undo', exact: true }).click();
      await page.waitForFunction(selector => document.querySelector(selector) === null, toast, { timeout: 2000 });
      await save.click();
      await page.waitForFunction(selector => document.querySelector(selector)?.getAttribute('data-motion-presence') === 'present', toast);
    }
    assert.deepEqual(pageErrors, []);
  } finally { await browser.close(); }
});

test(`${name}: Getting started is a tutorial in four numbered steps, none empty for any framework, whose toast plays the motion it defines, and which ends on How it works`, async () => {
  const browser = await browserType.launch();
  try {
    for (const framework of ['html', 'react', 'angular', 'svelte']) {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'no-preference' });
      await context.addInitScript(choice => localStorage.setItem('udixio:docs:preferred-example-framework', choice), framework);
      const page = await context.newPage();
      const pageErrors = [];
      page.on('pageerror', error => pageErrors.push(error.message));
      await page.goto(base + '/motion/getting-started/');
      // The steps, then what to read next; no "Related needs" and no reference section (weight, limits, tokens).
      const headings = (await page.locator('article h2').allTextContents()).map(text => text.trim());
      assert.deepEqual(headings, ['1. Install the package', '2. Define a motion', '3. Attach it', '4. See it play', 'Next'], framework);
      // Each step says something to the chosen framework: the visible text between its heading and the next one.
      const steps = await page.evaluate(() => [...document.querySelectorAll('article h2')].slice(0, 4).map(heading => {
        let text = '';
        for (let element = heading.nextElementSibling; element && element.tagName !== 'H2' && !element.querySelector('h2'); element = element.nextElementSibling) {
          if (element.getClientRects().length > 0) text += element.innerText;
        }
        return text.trim().length;
      }));
      for (const [index, length] of steps.entries()) assert.ok(length > 60, `${framework}: step ${index + 1} is almost empty (${length} characters)`);
      // The old anchor of the weight still lands on the page, and leads to Loading and weight.
      assert.equal(await page.locator('#weight a').getAttribute('href'), '/motion/loading-and-weight');
      assert.equal(await page.getByRole('link', { name: /^Next: How it works/ }).getAttribute('href'), '/motion/how-it-works');
      assert.equal(await page.locator('section[aria-labelledby="next"] a[href="/motion/choosing-an-api"]').count(), 1);
      assert.equal(await page.locator('section[aria-labelledby="next"] a[href="/motion/recipes"]').count(), 1);
      // The demo: Save shows the toast with the motion the page defines (it rises 16 px and grows from 96 %), Undo removes it.
      const panel = `[data-example-panel][data-framework="${framework}"][data-view="preview"]`;
      await page.locator(panel).evaluate(element => element.scrollIntoView({ block: 'start' }));
      await page.waitForFunction(selector => {
        const island = document.querySelector(`${selector} astro-island`);
        return !island || !island.hasAttribute('ssr');
      }, panel, { timeout: 30000 });
      const toast = `${panel} [role="status"] [data-motion-presence]`;
      // Sampled in the page from before the click: the smallest scale the toast is drawn at during its entry.
      const sampled = page.evaluate(selector => new Promise(resolve => {
        let least = Infinity;
        const begin = performance.now();
        const sample = () => {
          const element = document.querySelector(selector);
          if (element) {
            const style = getComputedStyle(element);
            const matrix = new DOMMatrixReadOnly(style.transform === 'none' ? undefined : style.transform);
            const own = style.scale === 'none' ? 1 : Number.parseFloat(style.scale);
            least = Math.min(least, matrix.a * own);
          }
          if (performance.now() - begin < 1200) requestAnimationFrame(sample);
          else resolve(least);
        };
        requestAnimationFrame(sample);
      }), toast);
      await page.locator(panel).getByRole('button', { name: 'Save to library', exact: true }).click();
      const least = await sampled;
      assert.ok(least >= 0.95 && least < 0.99, `${framework}: the toast's entry does not grow from 96 % (smallest scale ${least})`);
      await page.waitForFunction(selector => document.querySelector(selector)?.getAttribute('data-motion-presence') === 'present', toast);
      await page.locator(panel).getByRole('button', { name: 'Undo', exact: true }).click();
      await page.waitForFunction(selector => {
        const element = document.querySelector(selector);
        return element === null || getComputedStyle(element).display === 'none';
      }, toast, { timeout: 2000 });
      assert.deepEqual(pageErrors, [], framework);
      await context.close();
    }
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
          selected: [...document.querySelectorAll('[data-framework-choice][aria-checked="true"]')].map(el => el.dataset.frameworkChoice),
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

    /**
     * What the page shows now: the root, the variants, the switch and the code blocks once their toolbars hydrated. A
     * variant for several frameworks (a "Prefer it when" card for all but HTML) counts as the chosen one when it names it.
     */
    const shown = () => page.evaluate(() => ({
      root: document.documentElement.dataset.docsFramework,
      variants: [...new Set([...document.querySelectorAll('[data-framework-variant]:not([hidden])')].map(el => {
        const chosen = document.documentElement.dataset.docsFramework;
        return el.dataset.frameworkVariant.split(' ').includes(chosen) ? chosen : el.dataset.frameworkVariant;
      }))],
      selected: [...document.querySelectorAll('[data-framework-choice][aria-checked="true"]')].map(el => el.textContent.trim()),
      panels: [...new Set([...document.querySelectorAll('[data-example-panel]:not([hidden])')].map(el => el.dataset.framework))],
    }));
    // The header's switch changes the prose, the API names and every code block, once the islands have hydrated.
    await page.waitForFunction(() => document.querySelector('[data-code-ssr]') === null);
    // The switch is a setting, not tabs: a radio group (review 6, Y4).
    const switcher = page.getByRole('radiogroup', { name: 'Written for' });
    assert.equal(await page.getByRole('tablist', { name: 'Written for' }).count(), 0);
    await switcher.getByRole('radio', { name: 'Angular', exact: true }).click();
    assert.equal(await switcher.getByRole('radio', { name: 'Angular', exact: true }).getAttribute('aria-checked'), 'true');
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

test(`${name}: a mini-player grows into the player, and its content keeps its shape`, async () => {
  const browser = await browserType.launch();
  try {
    const context = await browser.newContext({ javaScriptEnabled: true, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto(base + '/motion/layout/');
    // The React tab of the demo: a mini-player that opens, inside its scope.
    const panel = '[data-example-panel][data-framework="react"][data-view="preview"]';
    const scope = `${panel} [data-motion-scope]`;
    const player = `${scope} > div`;
    const cover = `${player} > span`;
    await bringScene(page, panel, player);
    const rect = selector => page.evaluate(sel => {
      const box = document.querySelector(sel).getBoundingClientRect();
      return { top: box.top, height: box.height, width: box.width };
    }, selector);
    const toggle = label => page.evaluate(({ panelSelector, playerSelector, text }) => {
      // Click, then read in the page a task later: React commits the click in a microtask, and the move has just started,
      // so the player is still where it was (its first frame).
      const element = document.querySelector(playerSelector);
      const before = element.getBoundingClientRect().height;
      [...document.querySelector(panelSelector).querySelectorAll('button')].find(button => button.textContent.trim() === text).click();
      return new Promise(resolve => setTimeout(() => resolve({
        animations: element.getAnimations({ subtree: true }).length,
        height: element.getBoundingClientRect().height,
        before,
      }), 0));
    }, { panelSelector: panel, playerSelector: player, text: label });

    const closed = await rect(player);
    const coverAtRest = await rect(cover);
    assert.ok(closed.height < 80, `the mini-player is ${closed.height}px high at first`);

    const started = await toggle('Open');
    assert.ok(started.animations >= 1, 'the player has no move in flight');
    assert.ok(Math.abs(started.height - started.before) < 2, `the player jumped from ${started.before}px to ${started.height}px`);
    // Halfway through the move, the cover keeps its size: its content is not stretched with the player.
    await page.evaluate(sel => {
      for (const animation of document.querySelector(sel).getAnimations({ subtree: true })) {
        animation.pause();
        animation.currentTime = 80;
      }
    }, scope);
    const middle = await rect(cover);
    assert.ok(Math.abs(middle.width - coverAtRest.width) <= 1 && Math.abs(middle.height - coverAtRest.height) <= 1, `the cover is ${middle.width}x${middle.height}px mid-move, ${coverAtRest.width}x${coverAtRest.height}px at rest`);
    await page.evaluate(sel => {
      for (const animation of document.querySelector(sel).getAnimations({ subtree: true })) animation.play();
    }, scope);
    await page.waitForFunction(sel => document.querySelector(sel).getAnimations({ subtree: true }).length === 0, scope);
    const open = await rect(player);
    assert.ok(open.height > 200, `the player ended at ${open.height}px high`);
    assert.equal(await page.evaluate(sel => { const style = document.querySelector(sel).style; return style.translate !== '' || style.scale !== ''; }, player), false);

    const shut = await toggle('Close');
    assert.ok(shut.animations >= 1, 'the player has no move in flight when it closes');
    await page.waitForFunction(sel => document.querySelector(sel).getAnimations({ subtree: true }).length === 0, scope);
    const closedAgain = await rect(player);
    assert.ok(closedAgain.height < 80, `the player closed at ${closedAgain.height}px high`);
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

test(`${name}: a queue cascades in at the bottom, and its oldest tracks leave from the top, the others closing the gap`, async () => {
  const browser = await browserType.launch();
  try {
    const context = await browser.newContext({ javaScriptEnabled: true, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto(base + '/motion/lists/');
    // The React tab of the demo: a queue of five tracks at most, and its Add three button.
    const panel = '[data-example-panel][data-framework="react"][data-view="preview"]';
    const items = `${panel} ul > li`;
    await bringScene(page, panel, items);
    const add = page.locator(panel).getByRole('button', { name: 'Add three', exact: true });
    const count = () => page.locator(items).count();
    const titles = () => page.evaluate(selector => [...document.querySelectorAll(selector)].map(el => el.textContent.trim()), items);
    const waitForRest = () => page.waitForFunction(selector => [...document.querySelectorAll(selector)].every(el => el.getAnimations().length === 0), `${panel} ul *`);
    // The items in DOM order and in visual order (by top), and the gaps between consecutive boxes.
    const layout = () => page.evaluate(selector => {
      const elements = [...document.querySelectorAll(selector)];
      const dom = elements.map(el => el.textContent.trim());
      const visual = [...elements].sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top).map(el => el.textContent.trim());
      const boxes = elements.map(el => el.getBoundingClientRect());
      const gaps = boxes.slice(1).map((box, index) => box.top - boxes[index].bottom);
      return { dom, visual, gaps };
    }, items);
    // The queue starts full: five tracks.
    assert.deepEqual(await titles(), ['Intro', 'Morning', 'Harbour', 'Afterglow', 'Halfway']);

    // Add three: the three tracks enter in one task, below the others, and the first of them starts first. The queue keeps
    // five, so the three oldest leave from the top, and the tracks below them close the gap.
    await add.click();
    const delays = await page.evaluate(selector => [...document.querySelectorAll(selector)].slice(-3).map(el => {
      const values = el.getAnimations().map(animation => animation.effect.getTiming().delay);
      return values.length > 0 ? Math.max(...values) : null;
    }), items);
    assert.ok(delays.every(delay => delay !== null), 'a new track does not enter');
    assert.ok(Math.abs(delays[0]) <= 1 && Math.abs(delays[1] - 50) <= 1 && Math.abs(delays[2] - 100) <= 1, `the new tracks start at ${delays} ms, expected 0, 50 and 100`);
    await page.waitForFunction(([selector, expected]) => document.querySelectorAll(selector).length === expected, [items, 5]);
    await waitForRest();
    assert.deepEqual(await titles(), ['Afterglow', 'Halfway', 'Paper moon', 'Night drive', 'Glass city']);
    let order = await layout();
    assert.deepEqual(order.visual, order.dom);
    for (const gap of order.gaps) assert.ok(Math.abs(gap - 8) <= 1, `gap of ${gap}px between list items`);

    // Add three again: the same, from the tracks that are there.
    await add.click();
    await page.waitForFunction(([selector, expected]) => document.querySelectorAll(selector).length === expected, [items, 5]);
    await waitForRest();
    assert.deepEqual(await titles(), ['Night drive', 'Glass city', 'Low tide', 'Harbour', 'Afterglow']);
    order = await layout();
    assert.deepEqual(order.visual, order.dom);
    for (const gap of order.gaps) assert.ok(Math.abs(gap - 8) <= 1, `gap of ${gap}px between list items`);
    assert.deepEqual(pageErrors, []);
  } finally { await browser.close(); }
});

test(`${name}: the HTML queue takes its leaving tracks out of the DOM, so it holds the five it shows, as React does`, async () => {
  const browser = await browserType.launch();
  try {
    const context = await browser.newContext({ javaScriptEnabled: true, reducedMotion: 'no-preference' });
    await context.addInitScript(() => localStorage.setItem('udixio:docs:preferred-example-framework', 'html'));
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto(base + '/motion/lists/');
    // The HTML tab of the demo: the same queue, run by the example's own markup and script.
    const panel = '[data-example-panel][data-framework="html"][data-view="preview"]';
    const items = `${panel} ul > li`;
    await bringScene(page, panel, items);
    const add = page.locator(panel).getByRole('button', { name: 'Add three', exact: true });
    const count = () => page.locator(items).count();
    const titles = () => page.evaluate(selector => [...document.querySelectorAll(selector)].map(el => el.textContent.trim()), items);
    // The queue is quiet once no track animates; two frames later, the tracks that left are out of the DOM.
    const rest = async () => {
      await page.waitForFunction(selector => [...document.querySelectorAll(selector)].every(el => el.getAnimations().length === 0), `${panel} ul *`);
      await frames(page);
    };
    assert.deepEqual(await titles(), ['Intro', 'Morning', 'Harbour', 'Afterglow', 'Halfway']);

    // Add three, four times: a track that has left is removed once its exit has played, so five remain.
    for (let round = 1; round <= 4; round += 1) {
      await add.click();
      await rest();
      const held = await count();
      assert.equal(held, 5, `after round ${round} the list holds ${held} tracks, not five`);
    }
    assert.deepEqual(await titles(), ['Paper moon', 'Night drive', 'Glass city', 'Low tide', 'Harbour']);

    // Six clicks 90 ms apart, before the new tracks have entered: the tracks not yet shown leave as well.
    for (let click = 1; click <= 6; click += 1) {
      await add.click();
      await new Promise(resolve => setTimeout(resolve, 90));
    }
    await rest();
    const held = await count();
    assert.equal(held, 5, `after six quick clicks the list holds ${held} tracks, not five`);
    assert.deepEqual(await titles(), ['Harbour', 'Afterglow', 'Halfway', 'Paper moon', 'Night drive']);
    assert.deepEqual(pageErrors, []);
  } finally { await browser.close(); }
});

test(`${name}: a cover morphs into its player, and the player closes back into the cover`, async () => {
  const browser = await browserType.launch();
  try {
    const context = await browser.newContext({ javaScriptEnabled: true, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto(base + '/motion/shared-elements/');
    // The React tab of the demo: a cover that opens into its player, with the player's Close button.
    const panel = '[data-example-panel][data-framework="react"][data-view="preview"]';
    const cover = `${panel} button[aria-label="Open the player"]`;
    const player = `${panel} div[tabindex="-1"]`;
    await bringScene(page, panel, cover);
    const pageRect = selector => page.evaluate(sel => {
      const rect = document.querySelector(sel).getBoundingClientRect();
      return { left: rect.left, top: rect.top + window.scrollY, width: rect.width, height: rect.height };
    }, selector);
    const atRest = await pageRect(cover);

    // Open: click, then read a task later. The player has started from where the cover was.
    const opened = await page.evaluate(async ({ coverSelector, playerSelector }) => {
      const from = document.querySelector(coverSelector).getBoundingClientRect();
      document.querySelector(coverSelector).click();
      await new Promise(resolve => setTimeout(resolve, 0));
      const element = document.querySelector(playerSelector);
      const to = element.getBoundingClientRect();
      return {
        animations: element.getAnimations().length,
        from: { left: from.left, top: from.top, width: from.width, height: from.height },
        to: { left: to.left, top: to.top, width: to.width, height: to.height },
      };
    }, { coverSelector: cover, playerSelector: player });
    assert.ok(opened.animations >= 1, 'the player has no morph in flight');
    for (const key of ['left', 'top', 'width', 'height'])
      assert.ok(Math.abs(opened.to[key] - opened.from[key]) <= 2, `the player's ${key} is ${opened.to[key]}, the cover's is ${opened.from[key]}`);
    await page.waitForFunction(selector => document.querySelector(selector).getAnimations().length === 0, player);
    const shown = await pageRect(player);
    assert.ok(shown.width > atRest.width * 3, `the player is ${shown.width} px wide, the cover ${atRest.width} px`);
    assert.equal(await page.evaluate(selector => { const style = document.querySelector(selector).style; return style.translate !== '' || style.scale !== ''; }, player), false, 'the player keeps an inline transform at rest');

    // Close: the cover comes back from the player's last place.
    const closed = await page.evaluate(async ({ coverSelector, playerSelector }) => {
      const from = document.querySelector(playerSelector).getBoundingClientRect();
      [...document.querySelector(playerSelector).querySelectorAll('button')].find(button => button.textContent.trim() === 'Close').click();
      await new Promise(resolve => setTimeout(resolve, 0));
      const element = document.querySelector(coverSelector);
      const to = element.getBoundingClientRect();
      return {
        animations: element.getAnimations().length,
        from: { left: from.left, top: from.top, width: from.width, height: from.height },
        to: { left: to.left, top: to.top, width: to.width, height: to.height },
      };
    }, { coverSelector: cover, playerSelector: player });
    assert.ok(closed.animations >= 1, 'the cover has no morph in flight');
    for (const key of ['left', 'top', 'width', 'height'])
      assert.ok(Math.abs(closed.to[key] - closed.from[key]) <= 2, `the cover's ${key} is ${closed.to[key]}, the player's is ${closed.from[key]}`);
    await page.waitForFunction(selector => document.querySelector(selector).getAnimations().length === 0, cover);
    const back = await pageRect(cover);
    assert.ok(Math.abs(back.width - atRest.width) <= 1 && Math.abs(back.height - atRest.height) <= 1, `the cover is ${back.width} px wide again, it was ${atRest.width} px`);
    assert.deepEqual(pageErrors, []);
  } finally { await browser.close(); }
});

test(`${name}: tracks reveal as they scroll into view`, async () => {
  const browser = await browserType.launch();
  try {
    const context = await browser.newContext({ javaScriptEnabled: true, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto(base + '/motion/reveal/');
    // The React tab of the demo: a track list in a box that scrolls.
    const panel = '[data-example-panel][data-framework="react"][data-view="preview"]';
    const feed = `${panel} ol[aria-label="Tracks"]`;
    const cards = `${feed} > li`;
    await bringScene(page, panel, cards);
    // The feed scrolls: the cards below its visible part are in their first frame.
    const atLoad = await page.evaluate(([feedSelector, cardSelector]) => {
      const bottom = document.querySelector(feedSelector).getBoundingClientRect().bottom;
      return [...document.querySelectorAll(cardSelector)].map(el => ({
        below: el.getBoundingClientRect().top >= bottom,
        opacity: getComputedStyle(el).opacity,
      }));
    }, [feed, cards]);
    assert.equal(atLoad.length, 8);
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
    assert.equal(after.length, 8);
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
    // The demo is the React example: its preview panel holds the two cards that scrub.
    const demo = '[data-example-panel][data-framework="react"][data-view="preview"]';
    const tile = `${demo} article`;
    await bringScene(page, demo, tile);
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
    // The demo is the React example: its three bars are the loops, and its button holds them.
    const demo = '[data-example-panel][data-framework="react"][data-view="preview"]';
    const loops = `${demo} span.origin-bottom`;
    await bringScene(page, demo, loops);
    // One entry per loop: the play states of its animations.
    const playStates = () => page.evaluate(selector => [...document.querySelectorAll(selector)].map(el => el.getAnimations().map(animation => animation.playState)), loops);
    assert.deepEqual(await playStates(), [['running'], ['running'], ['running']]);
    const toggle = page.locator(demo).getByRole('button', { name: /^(Pause|Play)$/ });
    await toggle.click();
    await page.waitForFunction(selector => [...document.querySelectorAll(selector)].every(el => el.getAnimations()[0]?.playState === 'paused'), loops);
    assert.deepEqual(await playStates(), [['paused'], ['paused'], ['paused']]);
    await toggle.click();
    await page.waitForFunction(selector => [...document.querySelectorAll(selector)].every(el => el.getAnimations()[0]?.playState === 'running'), loops);
    assert.deepEqual(await playStates(), [['running'], ['running'], ['running']]);
    assert.deepEqual(pageErrors, []);
  } finally { await browser.close(); }
});

test(`${name}: values follow the pointer, and the progress follows the slider`, async () => {
  const browser = await browserType.launch();
  try {
    const context = await browser.newContext({ javaScriptEnabled: true, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto(base + '/motion/values/');
    // The demo is the React example: its cover is the tilted card, its bar the progress of the track.
    const demo = '[data-example-panel][data-framework="react"][data-view="preview"]';
    const cover = `${demo} div.rounded-3xl`;
    const bar = `${demo} data`;
    await bringScene(page, demo, cover);
    // The pointer at 75 % of the cover's width and at its middle height: the x value goes to 4 (the range is -8 to 8).
    await page.evaluate(selector => {
      const card = document.querySelector(selector);
      const box = card.getBoundingClientRect();
      card.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: box.left + box.width * 0.75, clientY: box.top + box.height / 2 }));
    }, cover);
    await page.waitForFunction(selector => Math.abs(Number(getComputedStyle(document.querySelector(selector)).getPropertyValue('--udx-motion-value-tilt-x')) - 4) < 0.2, cover);
    const tiltX = await page.evaluate(selector => Number(getComputedStyle(document.querySelector(selector)).getPropertyValue('--udx-motion-value-tilt-x')), cover);
    assert.ok(Math.abs(tiltX - 4) < 0.2, `the tilt is ${tiltX} at 75 % of the cover, expected 4`);
    // The slider sets the progress: its end is 1, and the bar follows it.
    await page.locator(demo).getByRole('slider', { name: 'Progress' }).focus();
    await page.keyboard.press('End');
    await page.waitForFunction(selector => Math.abs(Number(getComputedStyle(document.querySelector(selector)).getPropertyValue('--udx-motion-value-progress')) - 1) < 0.05, bar);
    assert.deepEqual(pageErrors, []);
  } finally { await browser.close(); }
});

test(`${name}: a counter counts to each new number, and a screen reader gets the final one`, async () => {
  const browser = await browserType.launch();
  try {
    const context = await browser.newContext({ javaScriptEnabled: true, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto(base + '/motion/values/');
    // The counter is the React example of the Counters section: the first motion usage after its heading.
    const demo = page.locator('#counters').locator('xpath=following::*[contains(concat(" ", normalize-space(@class), " "), " motion-usage ")][1]')
      .locator('[data-example-panel][data-framework="react"][data-view="preview"]');
    const counter = demo.locator('data');
    await counter.scrollIntoViewIfNeeded();
    await page.waitForLoadState('networkidle');
    const formatted = (locale, value) => page.evaluate(([tag, number]) => new Intl.NumberFormat(tag, { maximumFractionDigits: 0 }).format(number), [locale, value]);
    // A counter ends as one text node holding its number.
    const single = async text => {
      const deadline = Date.now() + 20000;
      while (Date.now() < deadline) {
        const done = await counter.evaluate((element, expected) => element.childNodes.length === 1 && element.firstChild.nodeType === Node.TEXT_NODE && element.textContent === expected, text);
        if (done) return;
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      assert.fail(`the counter does not end at ${text}`);
    };
    await single(await formatted('en', 12480));
    await demo.getByRole('button', { name: 'Add 1,000 plays', exact: true }).click();
    await single(await formatted('en', 13480));
    assert.equal(await counter.getAttribute('value'), '13480');
    assert.deepEqual(pageErrors, []);
  } finally { await browser.close(); }
});

test(`${name}: a sequence plays its steps in order`, async () => {
  const browser = await browserType.launch();
  try {
    const context = await browser.newContext({ javaScriptEnabled: true, reducedMotion: 'no-preference' });
    // Each animation of a step is recorded when it is created, with its delay and duration: most steps finish before a
    // test can read them. Only the steps of the first preview, the intro card, are recorded.
    await context.addInitScript(() => {
      window.__steps = [];
      const animate = Element.prototype.animate;
      Element.prototype.animate = function (keyframes, options) {
        const animation = animate.call(this, keyframes, options);
        const card = document.querySelector('[data-example-panel][data-framework=react][data-view=preview]');
        const step = this.closest('[data-motion-step]');
        if (step && card && card.contains(step)) {
          const timing = animation.effect.getTiming();
          const same = [...card.querySelectorAll('[data-motion-step="' + step.dataset.motionStep + '"]')];
          window.__steps.push({ step: step.dataset.motionStep, element: same.indexOf(step), delay: timing.delay, duration: timing.duration });
        }
        return animation;
      };
    });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto(base + '/motion/sequences/');
    await page.locator('[data-example-panel][data-framework=react][data-view=preview]').first().scrollIntoViewIfNeeded();
    // The card is server-rendered: it plays nothing until its Replay button is pressed, once its island has hydrated.
    await page.waitForFunction(() => {
      const panel = document.querySelectorAll('[data-example-panel][data-framework=react][data-view=preview]')[0];
      const islands = panel ? [...panel.querySelectorAll('astro-island')] : [];
      return islands.length > 0 && islands.every(island => !island.hasAttribute('ssr'));
    }, null, { timeout: 60000 });
    // The island binds the sequence a frame after it hydrates: the click comes once it has.
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 500)));
    await page.locator('[data-example-panel][data-framework=react][data-view=preview]').first().getByRole('button', { name: 'Replay' }).click();
    await page.waitForFunction(() => ['kicker', 'title', 'body'].every(name => window.__steps.some(entry => entry.step === name)), null, { timeout: 60000 });
    await page.waitForFunction(() => document.querySelectorAll('[data-example-panel][data-framework="react"][data-view="preview"]')[0].getAnimations({ subtree: true }).length === 0, null, { timeout: 20000 });
    const steps = await page.evaluate(() => window.__steps);
    // The first delay of each step, and the end of its last animation: a step starts when its token says.
    const span = name => {
      const of = steps.filter(entry => entry.step === name);
      assert.ok(of.length > 0, `the step ${name} was not played`);
      return { start: Math.min(...of.map(entry => entry.delay)), end: Math.max(...of.map(entry => entry.delay + entry.duration)) };
    };
    const kicker = span('kicker');
    const title = span('title');
    const body = span('body');
    assert.equal(kicker.start, 0, 'the kicker does not start at once');
    // +=normal: the title starts one normal stagger (50 ms) after the kicker starts, not after it ends.
    assert.equal(title.start, 50, `the title starts at ${title.start} ms, expected 50`);
    // +=normal again: the artist starts one normal stagger after the title starts.
    assert.equal(body.start, 100, `the artist starts at ${body.start} ms, expected 100`);
    const opacities = await page.evaluate(() => [...document.querySelectorAll('[data-example-panel][data-framework="react"][data-view="preview"]')[0].querySelectorAll('[data-motion-step="title"]')].map(element => getComputedStyle(element).opacity));
    assert.deepEqual(opacities, ['1']);
    assert.deepEqual(pageErrors, []);
  } finally { await browser.close(); }
});

async function hydratePreview(page, preview) {
  await page.waitForFunction(p => {
    const islands = document.querySelectorAll(p + ' astro-island');
    return islands.length > 0 && [...islands].every(island => !island.hasAttribute('ssr'));
  }, preview, { timeout: 60000 });
  // The gesture runtime binds the elements it is given: a bound element that can take no focus gets tabindex 0.
  await page.waitForFunction(p => document.querySelectorAll(p + ' [tabindex="0"]').length > 0, preview, { timeout: 60000 });
  await frames(page);
}

test(`${name}: a track dragged past its neighbour leaves its place in the queue`, async () => {
  const browser = await browserType.launch();
  try {
    const context = await browser.newContext({ javaScriptEnabled: true, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto(base + '/motion/gestures/');
    const preview = '[data-example-panel][data-framework="react"][data-view="preview"]';
    const tracks = `${preview} ul > li`;
    await page.locator(tracks).first().scrollIntoViewIfNeeded();
    await hydratePreview(page, preview);
    // The page may still be scrolling to the queue: the tracks are measured once it has settled.
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 500)));
    const first = await page.locator(tracks).nth(0).boundingBox();
    const second = await page.locator(tracks).nth(1).boundingBox();
    const x = first.x + first.width / 2;
    const y = first.y + first.height / 2;
    // In steps, past the centre of the second track: one reorder step.
    const distance = second.y + second.height / 2 - y + 4;
    await page.mouse.move(x, y);
    await page.mouse.down();
    for (let step = 1; step <= 16; step += 1) await page.mouse.move(x, y + (distance * step) / 16);
    await page.mouse.up();
    // The track has left its place. How many neighbours one drag passes is not pinned here.
    await page.waitForFunction(p => [...document.querySelectorAll(p + ' ul > li')].map(li => li.textContent.trim())[0] !== 'Night Drive', preview, { timeout: 20000 });
    assert.deepEqual(pageErrors, []);
  } finally { await browser.close(); }
});

test(`${name}: the suggestion is swiped away and counted, and the restore button brings it back`, async () => {
  const browser = await browserType.launch();
  try {
    const context = await browser.newContext({ javaScriptEnabled: true, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto(base + '/motion/gestures/');
    const preview = '[data-example-panel][data-framework="react"][data-view="preview"]';
    const card = page.locator(preview).getByText('Suggested: Lantern');
    await card.scrollIntoViewIfNeeded();
    await hydratePreview(page, preview);
    const box = await card.boundingBox();
    const y = box.y + box.height / 2;
    // Dragged to the right, past 40 % of its width, then released: it flies out.
    await page.mouse.move(box.x + 20, y);
    await page.mouse.down();
    for (let step = 1; step <= 8; step += 1) await page.mouse.move(box.x + 20 + (box.width * 0.7 * step) / 8, y);
    await page.mouse.up();
    await page.waitForFunction(p => /Swiped away: 1/.test(document.querySelector(p).textContent), preview, { timeout: 20000 });
    // The card is hidden from assistive technology once its fly-out has ended.
    await page.waitForFunction(p => {
      const card = [...document.querySelectorAll(p + ' div')].find(el => el.childElementCount === 0 && el.textContent.trim() === 'Suggested: Lantern');
      return card?.getAttribute('aria-hidden') === 'true';
    }, preview, { timeout: 20000 });
    await page.locator(preview).getByRole('button', { name: 'Restore the queue' }).click();
    await page.waitForFunction(p => /Swiped away: 0/.test(document.querySelector(p).textContent), preview, { timeout: 20000 });
    assert.equal(await page.locator(preview).getByText('Suggested: Lantern').getAttribute('aria-hidden'), null);
    assert.deepEqual(pageErrors, []);
  } finally { await browser.close(); }
});

test(`${name}: a track reorders with the keyboard, and the live region announces its place`, async () => {
  const browser = await browserType.launch();
  try {
    const context = await browser.newContext({ javaScriptEnabled: true, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto(base + '/motion/gestures/');
    const preview = '[data-example-panel][data-framework="react"][data-view="preview"]';
    const tracks = `${preview} ul > li`;
    await page.locator(tracks).first().scrollIntoViewIfNeeded();
    await hydratePreview(page, preview);
    // The live region's texts are recorded while the keys are pressed.
    await page.evaluate(() => {
      window.__announcements = [];
      new MutationObserver(() => {
        const text = document.querySelector('[data-udx-motion-live]')?.textContent;
        if (text) window.__announcements.push(text);
      }).observe(document.body, { subtree: true, childList: true, characterData: true });
    });
    // Space grabs the focused track, the arrow moves it one place, and Space drops it. Each key gets time to settle.
    await page.locator(tracks).first().focus();
    for (const key of ['Space', 'ArrowDown', 'Space']) {
      await page.keyboard.press(key);
      await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 300)));
    }
    await page.waitForFunction(p => [...document.querySelectorAll(p + ' ul > li')].map(li => li.textContent.trim()).join('|') === 'Signal Fire|Night Drive|Open Road', preview, { timeout: 20000 });
    const announced = await page.evaluate(() => window.__announcements);
    assert.ok(announced.some(text => /Position 2 of 3/.test(text)), `the live region said ${JSON.stringify([...new Set(announced)])}`);
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
    // The demo is the React example: its lyric is the paragraph of its preview.
    const heading = '[data-example-panel][data-framework="react"][data-view="preview"] p';
    await page.waitForSelector(heading);
    // The reveal is bound at connect: wait for the page to be quiet, then for the sentence to hold its first frame.
    await page.waitForLoadState('networkidle');
    await expectHeldBelowFold(page, heading);
    await expectWordsPlayed(page, heading, ['Every', 'word', 'arrives', 'in', 'turn,', 'and', 'is', 'read', 'once.'], 'Every word arrives in turn, and is read once.');
    // Next line: the next paragraph becomes the current one, and its words play in turn.
    await page.locator('[data-example-panel][data-framework="react"][data-view="preview"]').getByRole('button', { name: 'Next line' }).click();
    await expectWordsPlayed(page, '[data-example-panel][data-framework="react"][data-view="preview"] p:not(.hidden)', ['The', 'light', 'comes', 'in', 'slowly,', 'one', 'word', 'at', 'a', 'time.'], 'The light comes in slowly, one word at a time.');
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
    const heading = '[data-example-panel][data-framework="react"][data-view="preview"] p';
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

test(`${name}: a check is drawn on entry, and an icon morphs into a pause bar`, async () => {
  const browser = await browserType.launch();
  try {
    const context = await browser.newContext({ javaScriptEnabled: true, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto(base + '/motion/svg/');
    // The demo is the React example: its first svg holds the check, its last one the icon.
    const demo = '[data-example-panel][data-framework="react"][data-view="preview"]';
    const check = `${demo} svg:first-of-type path`;
    const icon = `${demo} svg:last-of-type path`;
    const morph = page.locator(demo).getByRole('button', { name: 'Morph' });
    await bringScene(page, demo, check);
    await page.waitForFunction(selector => document.querySelector(selector).getAnimations().length === 0, check, { timeout: 20000 });
    // The stroke is drawn, at rest: it is whole, with no dash inline.
    const drawn = await page.evaluate(selector => {
      const path = document.querySelector(selector);
      return { offset: parseFloat(getComputedStyle(path).strokeDashoffset), dash: path.style.strokeDasharray, inlineOffset: path.style.strokeDashoffset };
    }, check);
    assert.ok(Math.abs(drawn.offset) <= 0.001, `the stroke ends at dash offset ${drawn.offset}, expected 0`);
    assert.equal(drawn.dash, '');
    assert.equal(drawn.inlineOffset, '');

    // Morph: the icon becomes the pause bar, its button is pressed, and the morph leaves no path behind.
    const PAUSE = 'M7 5 H10 V19 H7 Z M14 5 H17 V19 H14 Z';
    const paths = () => page.evaluate(selector => document.querySelector(selector).closest('svg').querySelectorAll('path').length, icon);
    const pathsBefore = await paths();
    await morph.click();
    await page.waitForFunction(([selector, target]) => document.querySelector(selector).getAttribute('d') === target, [icon, PAUSE], { timeout: 20000 });
    assert.equal(await morph.getAttribute('aria-pressed'), 'true');
    assert.equal(await paths(), pathsBefore, 'the morph left a path behind');
    assert.deepEqual(pageErrors, []);
  } finally { await browser.close(); }
});

test(`${name}: the queue scrolls its current track to the top, and the track takes the focus`, async () => {
  const browser = await browserType.launch();
  try {
    const context = await browser.newContext({ javaScriptEnabled: true, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto(base + '/motion/scroll/');
    const preview = '[data-example-panel][data-framework="react"][data-view="preview"]';
    const box = `${preview} [role="region"][aria-label="Queue"]`;
    const track = `${box} li:nth-child(6)`;
    await page.locator(box).scrollIntoViewIfNeeded();
    // The island of the preview hydrates when it is in view: its button does nothing before.
    await page.waitForFunction(p => [...document.querySelectorAll(p + ' astro-island')].every(island => !island.hasAttribute('ssr')) && document.querySelectorAll(p + ' astro-island').length > 0, preview, { timeout: 60000 });
    await frames(page);
    assert.equal(await page.evaluate(selector => document.querySelector(selector).scrollTop, box), 0);
    await page.locator(preview).getByRole('button', { name: 'Go to the current track' }).click();
    // The scroll is over when the current track holds the focus, and its top is level with the top of the queue.
    await page.waitForFunction(({ box, track }) => {
      const frame = document.querySelector(box).getBoundingClientRect();
      const item = document.querySelector(track);
      return document.activeElement === item && Math.abs(item.getBoundingClientRect().top - frame.top) <= 2;
    }, { box, track }, { timeout: 20000 });
    const after = await page.evaluate(({ box, track }) => {
      const frame = document.querySelector(box);
      const item = document.querySelector(track);
      return {
        scrollTop: frame.scrollTop,
        offset: item.getBoundingClientRect().top - frame.getBoundingClientRect().top,
        focused: document.activeElement === item,
        text: item.textContent.trim(),
      };
    }, { box, track });
    assert.ok(after.scrollTop > 0, 'the queue did not scroll');
    assert.ok(Math.abs(after.offset) <= 2, `the current track is ${after.offset} px from the top of the queue`);
    assert.equal(after.focused, true);
    assert.ok(after.text.startsWith('Night Drive'), `the sixth track is "${after.text}", not the current one`);
    assert.deepEqual(pageErrors, []);
  } finally { await browser.close(); }
});

test(`${name}: a reorder says the place of its track each time the list gives it one, and Escape says where it ends, for every framework`, async () => {
  const browser = await browserType.launch();
  try {
    for (const label of ['React', 'Angular', 'Svelte', 'HTML']) {
      const key = label.toLowerCase();
      const context = await browser.newContext({ javaScriptEnabled: true, reducedMotion: 'no-preference' });
      const page = await context.newPage();
      const pageErrors = [];
      page.on('pageerror', error => pageErrors.push(error.message));
      await page.goto(base + '/motion/gestures/');
      const panel = `[data-example-panel][data-framework="${key}"][data-view="preview"]`;
      const tracks = `${panel} ul > li`;
      // Selecting a framework shows its preview; its tracks are bound (tabindex 0) once its island has hydrated, or its script ran.
      // The framework tabs are a React island: a click answers once it has hydrated, so the page waits for that first.
      await page.waitForFunction(() => {
        const island = document.querySelector('[aria-label="Example framework"]')?.closest('astro-island');
        return !island || !island.hasAttribute('ssr');
      }, undefined, { timeout: 60000 });
      await page.locator('[aria-label="Example framework"]').first().getByRole('tab', { name: label, exact: true }).click();
      await page.waitForFunction(selector => getComputedStyle(document.querySelector(selector)).display !== 'none', panel, { timeout: 30000 });
      await page.locator(panel).evaluate(element => element.scrollIntoView({ block: 'start' }));
      // The tracks are bound (tabindex 0) once the island has hydrated, or once the example's script has run.
      await page.waitForFunction(selector => document.querySelectorAll(selector + ' ul > li[tabindex="0"]').length === 3, panel, { timeout: 60000 });
      await frames(page);
      const names = () => page.evaluate(selector => [...document.querySelectorAll(selector)].map(item => item.textContent.trim()), tracks);
      const region = () => page.evaluate(() => document.querySelector('[data-udx-motion-live]')?.textContent.trim() ?? null);
      // Space grabs the first track, ArrowDown twice moves it down, Escape puts it back: 700 ms between the keys. After each key,
      // the region says the place the track holds in the DOM.
      await page.locator(tracks).first().focus();
      const grabbed = 'Night Drive';
      for (const [keyName, word] of [['Space', 'Grabbed'], ['ArrowDown', 'Moved'], ['ArrowDown', 'Moved'], ['Escape', 'Cancelled']]) {
        await page.keyboard.press(keyName);
        await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 700)));
        const order = await names();
        const place = order.indexOf(grabbed) + 1;
        assert.equal(await region(), `${word}. Position ${place} of ${order.length}.`, label + ' after ' + keyName + ': the list is ' + JSON.stringify(order));
      }
      assert.deepEqual(pageErrors, []);
      await context.close();
    }
  } finally { await browser.close(); }
});
}
