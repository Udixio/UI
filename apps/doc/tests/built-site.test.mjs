// The built site, read as the framework URL rules see it (framework-urls spec §2.6 to §2.10). The tests that read the output of
// `astro build` (.vercel/output) skip with a message while it is absent; the link rule of §2.8 is also checked on fixtures.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EXAMPLE_FRAMEWORKS } from '../src/stores/exampleFrameworkStore.ts';
import {
  canonicalUrl,
  featureTabs,
  frameworkRedirects,
  hasFrameworkVariants,
  isFrameworkStub,
  motionPagePaths,
  splitFramework,
  splitMotionPath,
  withFramework,
} from '../src/lib/framework-url.ts';
import { FRAMEWORK_LINES } from '../src/lib/motion-facts.ts';
import { MOTION_NEEDS, motionTitle } from '../src/lib/motion-nav.ts';

/** The public address of the site (astro.config.ts). */
const SITE = 'https://ui.udixio.fr/';
const OUTPUT = fileURLToPath(new URL('../.vercel/output/', import.meta.url));
const STATIC = join(OUTPUT, 'static');
const SKIP_WITHOUT_BUILD = existsSync(join(STATIC, 'index.html'))
  ? false
  : 'no build: run `npx astro build` first (its output is .vercel/output)';

// ─── A small HTML reader: elements with their attributes and parents, and text ───────────────────────────────────────

const VOID = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'source',
  'track',
  'wbr',
]);
const RAW_TEXT = new Set(['script', 'style']);
const TOKEN =
  /<!--[\s\S]*?-->|<![^>]*>|<\/(?<close>[a-z][\w-]*)\s*>|<(?<open>[a-z][\w-]*)(?<attrs>(?:\s+[^\s"'<>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*)\s*(?<self>\/?)>/gi;
const ATTRIBUTE =
  /([^\s"'<>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
const NAMED = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: '\xa0',
};

const decode = (text) =>
  text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, name) => {
    if (name[0] !== '#') return NAMED[name.toLowerCase()] ?? whole;
    const code =
      name[1].toLowerCase() === 'x'
        ? parseInt(name.slice(2), 16)
        : parseInt(name.slice(1), 10);
    return String.fromCodePoint(code);
  });

function parseAttributes(text) {
  const attrs = {};
  for (const [, name, double, single, bare] of text.matchAll(ATTRIBUTE)) {
    attrs[name.toLowerCase()] = decode(double ?? single ?? bare ?? '');
  }
  return attrs;
}

/** The document of an HTML text: its elements (tag, attrs, children, parent) and its text nodes (strings). */
function parse(html) {
  const document = {
    tag: '#document',
    attrs: {},
    children: [],
    parent: undefined,
  };
  const open = [document];
  const lower = html.toLowerCase();
  const token = new RegExp(TOKEN.source, 'gi');
  let at = 0;
  let match;
  while ((match = token.exec(html)) !== null) {
    const parent = open[open.length - 1];
    if (match.index > at) parent.children.push(html.slice(at, match.index));
    at = token.lastIndex;
    const { close, open: name, attrs, self } = match.groups;
    if (close !== undefined) {
      const index = open.findLastIndex(
        (element) => element.tag === close.toLowerCase(),
      );
      if (index > 0) open.length = index;
      continue;
    }
    if (name === undefined) continue;
    const tag = name.toLowerCase();
    const element = {
      tag,
      attrs: parseAttributes(attrs ?? ''),
      children: [],
      parent,
    };
    parent.children.push(element);
    if (self || VOID.has(tag)) continue;
    open.push(element);
    if (RAW_TEXT.has(tag)) {
      const end = lower.indexOf('</' + tag, at);
      const stop = end === -1 ? html.length : end;
      if (stop > at) element.children.push(html.slice(at, stop));
      at = stop;
      token.lastIndex = stop;
    }
  }
  if (at < html.length) open[open.length - 1].children.push(html.slice(at));
  return document;
}

const elementsOf = (node, out = []) => {
  for (const child of node.children) {
    if (typeof child === 'string') continue;
    out.push(child);
    elementsOf(child, out);
  }
  return out;
};

const textOf = (node) =>
  typeof node === 'string'
    ? decode(node)
    : RAW_TEXT.has(node.tag)
      ? ''
      : node.children.map(textOf).join('');

const ancestorsOf = (element) => {
  const out = [];
  for (
    let parent = element.parent;
    parent !== undefined;
    parent = parent.parent
  )
    out.push(parent);
  return out;
};

// ─── The built pages ─────────────────────────────────────────────────────────────────────────────────────────────────

const documents = new Map();
const documentAt = (file) => {
  if (!documents.has(file))
    documents.set(file, parse(readFileSync(file, 'utf8')));
  return documents.get(file);
};

/** The HTML files under a directory, recursively. */
function htmlFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = join(directory, entry.name);
    if (entry.isDirectory()) return htmlFiles(file);
    return entry.name.endsWith('.html') ? [file] : [];
  });
}

/** The address of a built page: `static/react/motion/presence/guide/index.html` is `/react/motion/presence/guide`. */
const addressOf = (file) => {
  const relativePath = relative(STATIC, file).split(sep).join('/');
  return (
    '/' + relativePath.replace(/(^|\/)index\.html$/, '').replace(/\.html$/, '')
  );
};

let pages;
/** Every built page, with its address and its file (the stubs and the fixtures included). */
function builtPages() {
  pages ??= htmlFiles(STATIC).map((file) => ({
    address: addressOf(file),
    file,
  }));
  return pages;
}

/** The built file of an address (`/motion` is `static/motion/index.html`), or undefined when the site has none. */
const fileFor = (address) =>
  [join(STATIC, address, 'index.html'), join(STATIC, `${address}.html`)].find(
    (file) => existsSync(file),
  );

const pageAt = (address) => {
  const file = fileFor(address);
  return file === undefined ? undefined : documentAt(file);
};

/** The internal links of a page: `href` values that start with one slash. */
function internalLinks(document) {
  return elementsOf(document)
    .filter(
      (element) => element.tag === 'a' && element.attrs.href !== undefined,
    )
    .map((element) => ({
      href: element.attrs.href,
      // A tab of the framework switch: a `role="tab"` link in a tablist (FrameworkSwitch).
      switched:
        element.attrs.role === 'tab' &&
        ancestorsOf(element).some((item) => item.attrs.role === 'tablist'),
    }))
    .filter(({ href }) => href.startsWith('/') && !href.startsWith('//'));
}

/** Whether an element is the card of a live example (CodePreview's card, `card-code`): its headings are the demo's. */
const inExample = (element) =>
  (element.attrs.class ?? '').split(/\s+/).includes('card-code');

const isFixture = (path) =>
  path === '/motion/fixtures' || path.startsWith('/motion/fixtures/');
const readingPages = () =>
  builtPages().filter(
    (page) => splitFramework(page.address).framework !== undefined,
  );

// ─── The rule of spec §2.8 ───────────────────────────────────────────────────────────────────────────────────────────

/**
 * What is wrong with an internal link, or undefined when it is correct (framework-urls spec §2.8). `from` is the page that
 * holds the link: its bare path and its reading (undefined on a neutral page). `switched` marks a tab of the framework
 * switch, which may name another reading of the same page.
 */
function linkProblem(href, from, switched = false) {
  const bare = href.replace(/[?#].*$/, '').replace(/\/+$/, '') || '/';
  const { framework, path } = splitFramework(bare);
  if (isFixture(path)) return undefined;
  const found = splitMotionPath(path);
  if (
    found !== undefined &&
    !MOTION_NEEDS.some((item) => item.slug === found.slug)
  ) {
    return 'a /motion path that is no page of MOTION_NEEDS';
  }
  if (framework === undefined) {
    return hasFrameworkVariants(path)
      ? 'a framework-dependent page without its framework'
      : undefined;
  }
  if (!hasFrameworkVariants(path))
    return 'a prefixed address of a page with no reading';
  if (found.tab === undefined && featureTabs(found.slug).length > 0)
    return 'a feature without its tab';
  if (found.tab !== undefined && !featureTabs(found.slug).includes(found.tab)) {
    return `the tab ${found.tab} of ${found.slug}, which the feature does not have`;
  }
  if (
    from.framework !== undefined &&
    framework !== from.framework &&
    !(switched && path === from.path)
  ) {
    return `a reading in ${framework} on a page read in ${from.framework}`;
  }
  return undefined;
}

/**
 * A motion link names a built page. The other links are not checked here: some pages of the site are served by the
 * server (config.json), and a static file has an extension.
 */
function missingPageProblem(href) {
  const bare = href.replace(/[?#].*$/, '').replace(/\/+$/, '') || '/';
  if (splitMotionPath(splitFramework(bare).path) === undefined)
    return undefined;
  return fileFor(bare) === undefined
    ? 'no built page at this address'
    : undefined;
}

// ─── Tests ───────────────────────────────────────────────────────────────────────────────────────────────────────────

const FRAMEWORKS = EXAMPLE_FRAMEWORKS;
const readingsOf = (bare) =>
  FRAMEWORKS.map((framework) => withFramework(bare, framework));
const need = (slug) => MOTION_NEEDS.find((item) => item.slug === slug);
const problemList = (problems) =>
  `${problems.length} problem(s):\n${problems.slice(0, 60).join('\n')}`;

test('the link rule of spec §2.8 classifies its fixtures', () => {
  const from = { path: '/motion/presence/guide', framework: 'react' };
  const neutral = { path: '/motion/glossary', framework: undefined };
  const cases = [
    ['/theme/colors', neutral, false, undefined],
    ['/motion/glossary', neutral, false, undefined],
    ['/motion', neutral, false, undefined],
    ['/motion/fixtures/components', neutral, false, undefined],
    ['/react/motion/presence/guide', neutral, false, undefined],
    ['/react/motion/presence/guide', from, false, undefined],
    ['/react/motion/presence/examples/', from, false, undefined],
    ['/react/motion/recipes/dialog', neutral, false, undefined],
    ['/svelte/motion/presence/guide', from, true, undefined],
    ['/motion/presence/guide', neutral, false, 'bare'],
    ['/motion/presence', neutral, false, 'bare'],
    ['/motion/layout#rules', neutral, false, 'bare'],
    ['/motion/recipes/dialog', neutral, false, 'bare'],
    ['/react/motion/presence', neutral, false, 'tab-less'],
    ['/react/motion/presence/overview', neutral, false, 'tab'],
    ['/react/motion/emphasis/examples', neutral, false, 'tab'],
    ['/react/motion/glossary', neutral, false, 'prefixed neutral'],
    ['/react/components/button/overview', neutral, false, 'prefixed component'],
    ['/motion/nope', neutral, false, 'no page'],
    ['/svelte/motion/presence/guide', from, false, 'other reading'],
    ['/svelte/motion/presence/examples', from, true, 'switch to another page'],
  ];
  const wrong = [];
  for (const [href, page, switched, expected] of cases) {
    const problem = linkProblem(href, page, switched);
    const ok =
      expected === undefined ? problem === undefined : problem !== undefined;
    if (!ok)
      wrong.push(
        `${href} from ${page.path}: ${problem ?? 'correct'} (expected ${expected ?? 'correct'})`,
      );
  }
  assert.deepEqual(wrong, []);
});

test(
  'every internal link of the built site is classified correct (spec §2.8)',
  { skip: SKIP_WITHOUT_BUILD },
  () => {
    const problems = [];
    for (const page of builtPages()) {
      const { framework, path } = splitFramework(page.address);
      // The stubs and the fixtures are not scanned: a stub is a page of its own (§2.5), a fixture is a test page.
      if (isFrameworkStub(page.address) || isFixture(path)) continue;
      for (const link of internalLinks(documentAt(page.file))) {
        const problem =
          linkProblem(link.href, { path, framework }, link.switched) ??
          missingPageProblem(link.href);
        if (problem !== undefined)
          problems.push(`${page.address} -> ${link.href}: ${problem}`);
      }
    }
    assert.deepEqual(problems, [], problemList(problems));
  },
);

test(
  'every internal hash names an id of its target page (motion pages only)',
  { skip: SKIP_WITHOUT_BUILD },
  () => {
    const problems = [];
    for (const page of builtPages()) {
      const { path } = splitFramework(page.address);
      if (isFrameworkStub(page.address) || isFixture(path)) continue;
      for (const { href } of internalLinks(documentAt(page.file))) {
        const at = href.indexOf('#');
        if (at === -1) continue;
        const bare =
          href.slice(0, at).replace(/\?.*$/, '').replace(/\/+$/, '') || '/';
        const { framework, path: target } = splitFramework(bare);
        // A bare framework-dependent address is already a problem of the link rule: its hash is not checked here.
        if (
          splitMotionPath(target) === undefined ||
          (framework === undefined && hasFrameworkVariants(target))
        )
          continue;
        const file = fileFor(bare);
        if (file === undefined) continue;
        const hash = decodeURIComponent(href.slice(at + 1));
        const ids = new Set(
          elementsOf(documentAt(file)).map((element) => element.attrs.id),
        );
        if (!ids.has(hash))
          problems.push(
            `${page.address} -> ${href}: no id "${hash}" on ${bare}`,
          );
      }
    }
    assert.deepEqual(problems, [], problemList(problems));
  },
);

test(
  'the four readings of a page have equal heading ids',
  { skip: SKIP_WITHOUT_BUILD },
  () => {
    const problems = [];
    for (const { path } of motionPagePaths()) {
      // The prose's headings. A live example is the demo of its framework, in a card (`card-code`), and its own headings
      // (a dialog's title, for one) are the demo's, not the page's: a reading shows only its framework's example, so they
      // are left out, and the rule compares the headings of the prose.
      const headings = readingsOf(path).map((reading) => {
        const document = pageAt(reading);
        if (document === undefined) {
          problems.push(`${reading}: no built reading`);
          return undefined;
        }
        return elementsOf(document)
          .filter(
            (element) =>
              /^h[1-6]$/.test(element.tag) &&
              element.attrs.id !== undefined &&
              !ancestorsOf(element).some(inExample),
          )
          .map((element) => `${element.tag}#${element.attrs.id}`);
      });
      const [first, ...others] = headings;
      if (first === undefined) continue;
      others.forEach((other, index) => {
        if (JSON.stringify(other) !== JSON.stringify(first)) {
          problems.push(
            `${path}: ${FRAMEWORKS[index + 1]} has ${JSON.stringify(other)}, ${FRAMEWORKS[0]} has ${JSON.stringify(first)}`,
          );
        }
      });
    }
    assert.deepEqual(problems, [], problemList(problems));
  },
);

test(
  'the four readings of each motion page are built',
  { skip: SKIP_WITHOUT_BUILD },
  () => {
    const expected = motionPagePaths().length * FRAMEWORKS.length;
    const built = readingPages().length;
    assert.equal(
      built,
      expected,
      `${built} readings are built, ${expected} expected`,
    );
  },
);

test(
  'no reading holds a framework variant',
  { skip: SKIP_WITHOUT_BUILD },
  () => {
    const problems = [];
    for (const page of readingPages()) {
      for (const element of elementsOf(documentAt(page.file))) {
        if (
          element.attrs['data-framework-variant'] !== undefined ||
          element.attrs['data-code-tab'] !== undefined
        ) {
          problems.push(
            `${page.address}: <${element.tag}> with ${Object.keys(element.attrs).join(' ')}`,
          );
        }
      }
    }
    assert.deepEqual(problems, [], problemList(problems));
  },
);

test(
  'every code block of a reading shows code',
  { skip: SKIP_WITHOUT_BUILD },
  () => {
    const problems = [];
    for (const page of readingPages()) {
      const cards = elementsOf(documentAt(page.file)).filter((element) =>
        (element.attrs.class ?? '').split(/\s+/).includes('card-code'),
      );
      for (const card of cards) {
        const descendants = elementsOf(card);
        const panels = descendants.filter(
          (element) => element.attrs['data-example-panel'] !== undefined,
        );
        if (panels.length > 0) {
          const codes = panels.filter(
            (element) => element.attrs['data-view'] === 'code',
          );
          if (codes.length !== 1)
            problems.push(
              `${page.address}: ${codes.length} code panels in a block, one expected`,
            );
          else if (textOf(codes[0]).trim() === '')
            problems.push(`${page.address}: an empty code panel`);
        } else if (
          !descendants.some(
            (element) => element.tag === 'pre' && textOf(element).trim() !== '',
          )
        ) {
          problems.push(`${page.address}: a code block with no code`);
        }
      }
    }
    assert.deepEqual(problems, [], problemList(problems));
  },
);

test(
  "a reading's title is motionTitle and its description ends with its FRAMEWORK_LINES sentence",
  { skip: SKIP_WITHOUT_BUILD },
  () => {
    const problems = [];
    for (const page of readingPages()) {
      const { framework, path } = splitFramework(page.address);
      const found = splitMotionPath(path);
      if (found === undefined || !hasFrameworkVariants(path)) continue;
      const document = documentAt(page.file);
      const title = elementsOf(document).find(
        (element) => element.tag === 'title',
      );
      const description = elementsOf(document).find(
        (element) =>
          element.tag === 'meta' && element.attrs.name === 'description',
      );
      const expectedTitle = `${motionTitle(need(found.slug), framework, found.tab)} — Udixio UI`;
      if (textOf(title).trim() !== expectedTitle) {
        problems.push(
          `${page.address}: title "${textOf(title).trim()}", expected "${expectedTitle}"`,
        );
      }
      if (
        !String(description?.attrs.content).endsWith(FRAMEWORK_LINES[framework])
      ) {
        problems.push(
          `${page.address}: the description does not end with "${FRAMEWORK_LINES[framework]}"`,
        );
      }
    }
    assert.deepEqual(problems, [], problemList(problems));
  },
);

test(
  'a stub lists four readings, points its canonical to React, and is ignored by Pagefind',
  { skip: SKIP_WITHOUT_BUILD },
  () => {
    const stubs = [
      ...new Set([
        ...motionPagePaths().map((page) => page.path),
        ...MOTION_NEEDS.filter(
          (item) =>
            item.perFramework &&
            item.tabs !== undefined &&
            !item.href.includes('#'),
        ).map((item) => item.href),
      ]),
    ];
    const problems = [];
    for (const path of stubs) {
      const document = pageAt(path);
      if (document === undefined) {
        problems.push(`${path}: no built stub`);
        continue;
      }
      const listed = elementsOf(document)
        .filter(
          (element) => element.tag === 'a' && element.attrs.href !== undefined,
        )
        .map((element) => element.attrs.href)
        .sort();
      if (JSON.stringify(listed) !== JSON.stringify(readingsOf(path).sort())) {
        problems.push(`${path}: lists ${listed.join(', ')}`);
      }
      const canonical = elementsOf(document).find(
        (element) =>
          element.tag === 'link' && element.attrs.rel === 'canonical',
      );
      const expectedCanonical = canonicalUrl(
        withFramework(path, 'react'),
        SITE,
      );
      if (canonical?.attrs.href !== expectedCanonical)
        problems.push(`${path}: canonical ${canonical?.attrs.href}`);
      const body = elementsOf(document).find(
        (element) => element.tag === 'body',
      );
      if (body?.attrs['data-pagefind-ignore'] === undefined)
        problems.push(`${path}: not ignored by Pagefind`);
    }
    assert.deepEqual(problems, [], problemList(problems));
  },
);

// The redirects of astro.config.ts: the pages of the `pages` collection, then the three other neutral addresses.
function neutralAddresses() {
  const directory = fileURLToPath(
    new URL('../src/data/pages/', import.meta.url),
  );
  const addresses = readdirSync(directory, {
    encoding: 'utf8',
    recursive: true,
  })
    .filter((file) => /\.mdx?$/.test(file))
    .map(
      (file) =>
        `/${file.replace(/\.mdx?$/, '')}`.replace(/\/index$/, '') || '/',
    );
  return [...addresses, '/themes', '/theme/builder', '/'];
}

/** The 301 that config.json answers for a path, when it is one, and where its route is in the list. */
function redirectOf(routes, path) {
  const index = routes.findIndex(
    (route) => route.src !== undefined && new RegExp(route.src).test(path),
  );
  const route = routes[index];
  return route?.status === 301
    ? { location: route.headers.Location, index }
    : undefined;
}

test(
  'config.json holds the redirects of spec §2.6',
  { skip: SKIP_WITHOUT_BUILD },
  () => {
    const { routes } = JSON.parse(
      readFileSync(join(OUTPUT, 'config.json'), 'utf8'),
    );
    const filesystem = routes.findIndex(
      (route) => route.handle === 'filesystem',
    );
    const expected = {
      '/react/get-started/introduction': '/get-started/introduction',
      '/svelte/agents': '/agents',
      '/angular/mcp': '/mcp',
      '/react/themes': '/themes',
      '/react': '/',
      '/svelte/motion/glossary': '/motion/glossary',
      '/react/motion/presence': '/react/motion/presence/guide',
    };
    const problems = [];
    for (const [from, to] of Object.entries(expected)) {
      const redirect = redirectOf(routes, from);
      if (redirect?.location !== to)
        problems.push(`${from}: ${redirect?.location} instead of ${to}`);
      else if (redirect.index > filesystem)
        problems.push(`${from}: the redirect comes after handle: filesystem`);
      if (fileFor(from) !== undefined)
        problems.push(`${from}: a built file answers it`);
    }
    for (const from of [
      '/react/components/button/overview',
      '/html/theme/colors',
    ]) {
      if (redirectOf(routes, from) !== undefined)
        problems.push(`${from}: redirected, expected a 404`);
    }
    assert.deepEqual(problems, [], problemList(problems));
  },
);

test(
  'config.json holds every redirect of frameworkRedirects',
  { skip: SKIP_WITHOUT_BUILD },
  () => {
    const { routes } = JSON.parse(
      readFileSync(join(OUTPUT, 'config.json'), 'utf8'),
    );
    const filesystem = routes.findIndex(
      (route) => route.handle === 'filesystem',
    );
    const problems = [];
    for (const [from, to] of Object.entries(
      frameworkRedirects(neutralAddresses()),
    )) {
      const redirect = redirectOf(routes, from);
      if (redirect?.location !== to || redirect.index > filesystem)
        problems.push(`${from} -> ${to}`);
    }
    assert.deepEqual(problems, [], problemList(problems));
  },
);

test(
  'the sitemap lists readings and neutral pages, no stub, fixture or roadmap',
  { skip: SKIP_WITHOUT_BUILD },
  () => {
    const xml = readFileSync(join(STATIC, 'sitemap-0.xml'), 'utf8');
    const listed = new Set(
      [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
        (match) => new URL(match[1]).pathname,
      ),
    );
    const problems = [];
    for (const { path } of motionPagePaths()) {
      for (const reading of readingsOf(path)) {
        if (!listed.has(reading)) problems.push(`missing ${reading}`);
      }
    }
    for (const neutral of [
      '/',
      '/motion',
      '/motion/glossary',
      '/motion/limits',
      '/motion/api',
      '/motion/loading-and-weight',
    ]) {
      if (!listed.has(neutral)) problems.push(`missing ${neutral}`);
    }
    for (const path of listed) {
      if (isFrameworkStub(path)) problems.push(`a stub is listed: ${path}`);
      if (isFixture(path) || path === '/motion/roadmap')
        problems.push(`listed: ${path}`);
      const { framework, path: bare } = splitFramework(path);
      if (framework !== undefined && !hasFrameworkVariants(bare))
        problems.push(`a prefixed page with no reading: ${path}`);
    }
    assert.deepEqual(problems, [], problemList(problems));
  },
);

/** The canonical address a page declares (its `<link rel="canonical">`), or undefined. */
const canonicalOf = (document) =>
  elementsOf(document).find(
    (element) => element.tag === 'link' && element.attrs.rel === 'canonical',
  )?.attrs.href;

test(
  'every page has a canonical equal to canonicalUrl of its path (spec §2.9)',
  { skip: SKIP_WITHOUT_BUILD },
  () => {
    const problems = [];
    for (const page of builtPages()) {
      // A stub is a document of its own, whose canonical is the React reading (the stub test above).
      if (isFrameworkStub(page.address)) continue;
      const expected = canonicalUrl(page.address, SITE);
      const canonical = canonicalOf(documentAt(page.file));
      if (canonical !== expected)
        problems.push(
          `${page.address}: canonical ${canonical ?? 'none'}, expected ${expected}`,
        );
    }
    assert.deepEqual(problems, [], problemList(problems));
  },
);

test(
  'each canonical equals its sitemap entry as a string (spec §2.9)',
  { skip: SKIP_WITHOUT_BUILD },
  () => {
    const xml = readFileSync(join(STATIC, 'sitemap-0.xml'), 'utf8');
    const problems = [];
    for (const [, loc] of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      const file = fileFor(new URL(loc).pathname);
      if (file === undefined) {
        problems.push(`${loc}: no built page`);
        continue;
      }
      const canonical = canonicalOf(documentAt(file));
      if (canonical !== loc)
        problems.push(`${loc}: canonical ${canonical ?? 'none'}`);
    }
    assert.deepEqual(problems, [], problemList(problems));
  },
);

test(
  'a reading declares its one framework filter, every other page the four (spec §2.8)',
  { skip: SKIP_WITHOUT_BUILD },
  () => {
    const problems = [];
    for (const page of builtPages()) {
      // A stub is ignored by Pagefind and declares no filter of its own (the stub test above).
      if (isFrameworkStub(page.address)) continue;
      const { framework, path } = splitFramework(page.address);
      const expected =
        framework !== undefined && hasFrameworkVariants(path)
          ? [framework]
          : [...FRAMEWORKS];
      const declared = elementsOf(documentAt(page.file))
        .filter(
          (element) =>
            element.tag === 'meta' &&
            element.attrs['data-pagefind-filter'] === 'framework[content]',
        )
        .map((element) => element.attrs.content);
      if (
        JSON.stringify([...declared].sort()) !==
        JSON.stringify([...expected].sort())
      ) {
        problems.push(
          `${page.address}: declares ${declared.join(', ') || 'no framework'}, expected ${expected.join(', ')}`,
        );
      }
    }
    assert.deepEqual(problems, [], problemList(problems));
  },
);
