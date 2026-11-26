// The claims of six motion pages, checked against their own text (review 7, B1–B4, B8, B9).
// Run against a site: MOTION_BROWSERS=chromium MOTION_DOC_URL=http://localhost:4322 node --test tests/motion-page-claims.browser.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium, firefox, webkit } from 'playwright';

const base = process.env.MOTION_DOC_URL ?? 'http://localhost:4322';
const browserTypes = { chromium, firefox, webkit };
const browsers = (process.env.MOTION_BROWSERS ?? 'chromium').split(',').map(name => name.trim());
const STORAGE_KEY = 'udixio:docs:preferred-example-framework';

/** A page in the given framework: the visible text of the article is what the reader of that framework gets. */
async function open(browser, path, framework = 'react') {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.addInitScript(([key, value]) => window.localStorage.setItem(key, value), [STORAGE_KEY, framework]);
  const page = await context.newPage();
  await page.goto(base + path, { waitUntil: 'load' });
  return { context, page };
}

/** The visible text of the section that a heading opens, up to the next heading of the same level or higher. */
function sectionText(page, id) {
  return page.evaluate(sectionId => {
    const heading = document.getElementById(sectionId);
    const level = Number(heading.tagName.slice(1));
    let text = '';
    for (let node = heading.nextElementSibling; node; node = node.nextElementSibling) {
      if (/^H[1-6]$/.test(node.tagName) && Number(node.tagName.slice(1)) <= level) break;
      text += ' ' + node.innerText;
    }
    return text.replace(/\s+/g, ' ');
  }, id);
}

/** The visible text of a Good to know fact, by its label. */
function factText(page, label) {
  return page.evaluate(name => {
    const term = [...document.querySelectorAll('dt')].find(dt => dt.textContent.trim() === name);
    return term.nextElementSibling.innerText.replace(/\s+/g, ' ');
  }, label);
}

/** The visible items of a list: the one after a heading, or the one of a fact. */
function listAfter(page, id) {
  return page.evaluate(sectionId => {
    let node = document.getElementById(sectionId).nextElementSibling;
    while (node && node.tagName !== 'UL') node = node.nextElementSibling;
    return [...node.querySelectorAll(':scope > li')].filter(li => li.getClientRects().length > 0).map(li => li.innerText.trim());
  }, id);
}
function factItems(page, label) {
  return page.evaluate(name => {
    const term = [...document.querySelectorAll('dt')].find(dt => dt.textContent.trim() === name);
    return [...term.nextElementSibling.querySelectorAll('li')].filter(li => li.getClientRects().length > 0).map(li => li.innerText.trim());
  }, label);
}

/** The words of a sentence, lower case, without the short ones. */
const words = text => new Set(text.toLowerCase().match(/[a-z]{4,}/g) ?? []);
function overlap(a, b) {
  const [left, right] = [words(a), words(b)];
  const shared = [...left].filter(word => right.has(word)).length;
  return shared / Math.min(left.size, right.size);
}

for (const name of browsers) {
  test(`motion page claims (${name})`, async t => {
    const browser = await browserTypes[name].launch();
    try {
      await t.test('/motion/text: the timing of a reveal says what the options table says (B1)', async () => {
        const { context, page } = await open(browser, '/motion/text/');
        const timing = await factText(page, 'Timing');
        // The runtime splits a reveal's frames: the movement on the spatial spring, the opacity on the effects spring.
        assert.match(timing, /fades? on the default effects spring/);
        assert.ok(timing.includes('spring.default.effects'), timing);
        assert.doesNotMatch(timing, /moves and fades on the default spatial spring/);
        await context.close();
      });

      await t.test('/motion/shared-elements: one rule for the time between the two elements (B2)', async () => {
        const { context, page } = await open(browser, '/motion/shared-elements/');
        const article = await page.locator('article').innerText();
        assert.doesNotMatch(article, /same task/);
        const starts = await sectionText(page, 'what-starts-it');
        const limits = await factText(page, 'Limits');
        for (const text of [starts, limits]) assert.match(text, /600 ms/, text);
        await context.close();
      });

      await t.test('/motion/presets: no second, stale table of the verbs, and no HTML in the Svelte view (B3)', async () => {
        const { context, page } = await open(browser, '/motion/presets/', 'svelte');
        assert.equal(await page.locator('#the-seven-verbs').count(), 0);
        const article = await page.locator('article').innerText();
        assert.doesNotMatch(article, /The reverse of appear/);
        assert.doesNotMatch(article, /data-motion/, 'the Svelte view names an HTML attribute');
        assert.doesNotMatch(article, /· open/);
        assert.doesNotMatch(await page.title(), /verbs/);
        // The verbs have one table, in How it works.
        assert.equal(await page.locator('article a[href="/motion/how-it-works#verbs"]').count() > 0, true);
        await context.close();
      });

      await t.test('/motion/tokens: every duration is listed, and the choice of a spring reads in short parts (B4)', async () => {
        const { context, page } = await open(browser, '/motion/tokens/');
        const durations = await page.locator('#values ~ div table tbody th code').evaluateAll(cells =>
          cells.map(cell => cell.textContent.trim()).filter(text => text.startsWith('duration.')),
        );
        assert.equal(durations.length, 16, durations.join(', '));
        const paragraphs = await page.evaluate(() => {
          const lengths = [];
          for (let node = document.getElementById('which-spring-to-use').nextElementSibling; node && node.tagName !== 'H2'; node = node.nextElementSibling) {
            if (node.tagName === 'P') lengths.push(node.innerText.length);
          }
          return lengths;
        });
        for (const length of paragraphs) assert.ok(length <= 420, `a paragraph of ${length} characters in Which spring to use`);
        const springs = await page.locator('#which-spring-to-use ~ div table').first().locator('tbody th').allInnerTexts();
        assert.ok(springs.some(text => text.includes('spring.fast.spatial')), springs.join(', '));
        await context.close();
      });

      await t.test('/motion/svg: Rules and Limits each say their own thing (B9)', async () => {
        const { context, page } = await open(browser, '/motion/svg/');
        const rules = await listAfter(page, 'rules');
        const limits = await factItems(page, 'Limits');
        for (const rule of rules) {
          for (const limit of limits) assert.ok(overlap(rule, limit) < 0.5, `repeated:\n  ${rule}\n  ${limit}`);
        }
        await context.close();
      });

      await t.test('/motion/page-transitions: the page says how the demo scopes its transition, and what navigate() does (B8)', async () => {
        const { context, page } = await open(browser, '/motion/page-transitions/');
        const article = (await page.locator('article').innerText()).replace(/\s+/g, ' ');
        assert.match(article, /view-transition-name/);
        assert.match(article, /navigate\(\) (always )?transitions the whole document/);
        await context.close();
      });
    } finally {
      await browser.close();
    }
  });
}
