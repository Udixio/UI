// The URL rule of the documentation (framework-urls spec §2): readings, tabs, redirects, links, canonicals and titles.
// Plain Node loads the modules under test from their TypeScript sources.
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  canonicalUrl,
  defaultTab,
  docLink,
  featureTabs,
  frameworkRedirects,
  isFrameworkStub,
  motionPagePaths,
  readingFramework,
  splitFramework,
  splitMotionPath,
  withFramework,
} from '../src/lib/framework-url.ts';
import { FRAMEWORK_LINES } from '../src/lib/motion-facts.ts';
import {
  MOTION_NEEDS,
  motionDescription,
  motionTitle,
} from '../src/lib/motion-nav.ts';
import { motionUrl } from './motion-url.mjs';

const FRAMEWORKS = ['html', 'react', 'angular', 'svelte'];
const need = (slug) => MOTION_NEEDS.find((item) => item.slug === slug);

test('splitFramework strips a framework prefix only', () => {
  assert.deepEqual(splitFramework('/react/motion/presence/guide/'), {
    framework: 'react',
    path: '/motion/presence/guide',
  });
  assert.deepEqual(splitFramework('/motion/glossary'), {
    path: '/motion/glossary',
  });
  assert.deepEqual(splitFramework('/reactive/x'), { path: '/reactive/x' });
  assert.deepEqual(splitFramework('/svelte'), {
    framework: 'svelte',
    path: '/',
  });
});

test('splitFramework keeps the query and the hash after the path', () => {
  assert.deepEqual(splitFramework('/react/motion/presence/guide/?x=1#y'), {
    framework: 'react',
    path: '/motion/presence/guide?x=1#y',
  });
});

test('featureTabs reads the data, and defaultTab is its first tab', () => {
  assert.deepEqual(featureTabs('presence'), ['guide', 'examples']);
  assert.deepEqual(featureTabs('layout'), ['guide', 'examples']);
  assert.deepEqual(featureTabs('emphasis'), ['guide']);
  assert.deepEqual(featureTabs('getting-started'), []);
  assert.equal(defaultTab('presence'), 'guide');
  assert.equal(defaultTab('getting-started'), undefined);
});

test('splitMotionPath reads the tab of a feature and keeps the slug of any other page', () => {
  assert.deepEqual(splitMotionPath('/motion/presence/guide'), {
    slug: 'presence',
    tab: 'guide',
  });
  assert.deepEqual(splitMotionPath('/motion/recipes/dialog'), {
    slug: 'recipes/dialog',
  });
  assert.deepEqual(splitMotionPath('/motion/presence/?x=1#y'), {
    slug: 'presence',
  });
  assert.equal(splitMotionPath('/theme/colors'), undefined);
});

test('withFramework prefixes, resolves the default tab, keeps query and hash', () => {
  assert.equal(
    withFramework('/motion/layout?x=1#rules', 'angular'),
    '/angular/motion/layout/guide?x=1#rules',
  );
  assert.equal(
    withFramework('/motion/layout#rules', 'react'),
    '/react/motion/layout/guide#rules',
  );
  assert.equal(
    withFramework('/motion/presence/examples', 'svelte'),
    '/svelte/motion/presence/examples',
  );
  assert.equal(
    withFramework('/motion/recipes/dialog', 'html'),
    '/html/motion/recipes/dialog',
  );
  assert.equal(
    withFramework('/motion/values#counters', 'react'),
    '/react/motion/values/guide#counters',
  );
  assert.equal(withFramework('/motion/glossary', 'react'), '/motion/glossary');
  assert.equal(
    withFramework('/motion/presence', undefined),
    '/motion/presence',
  );
});

test('docLink marks a framework link on a neutral page only', () => {
  assert.deepEqual(docLink('/motion/presence', undefined), {
    href: '/react/motion/presence/guide',
    frameworkLink: true,
  });
  assert.deepEqual(docLink('/motion/presence', 'svelte'), {
    href: '/svelte/motion/presence/guide',
    frameworkLink: false,
  });
  assert.deepEqual(docLink('/motion/glossary#term-box', 'svelte'), {
    href: '/motion/glossary#term-box',
    frameworkLink: false,
  });
  assert.deepEqual(docLink('https://example.com', undefined), {
    href: 'https://example.com',
    frameworkLink: false,
  });
});

test('frameworkRedirects covers neutral pages and tab-less features', () => {
  const redirects = frameworkRedirects([
    '/theme/colors',
    '/get-started/introduction',
    '/agents',
    '/mcp',
    '/themes',
    '/theme/builder',
    '/',
  ]);
  assert.equal(redirects['/react/motion/glossary'], '/motion/glossary');
  assert.equal(redirects['/html/motion/api'], '/motion/api');
  assert.equal(redirects['/svelte/motion'], '/motion');
  assert.equal(redirects['/angular/theme/colors'], '/theme/colors');
  assert.equal(
    redirects['/react/get-started/introduction'],
    '/get-started/introduction',
  );
  assert.equal(redirects['/svelte/agents'], '/agents');
  assert.equal(redirects['/angular/mcp'], '/mcp');
  assert.equal(redirects['/react/themes'], '/themes');
  assert.equal(redirects['/react'], '/');
  assert.equal(
    redirects['/react/motion/presence'],
    '/react/motion/presence/guide',
  );
  assert.equal(redirects['/html/theme/colors'], undefined);
  assert.equal(redirects['/html'], undefined);
  assert.ok(
    !Object.keys(redirects).some((key) => key.startsWith('/react/components/')),
  );
  for (const page of motionPagePaths()) {
    for (const framework of FRAMEWORKS) {
      assert.equal(
        redirects[`/${framework}${page.path}`],
        undefined,
        `${framework}${page.path} is a page, not a redirect`,
      );
    }
  }
});

test('motionPagePaths lists every reading once', () => {
  const paths = motionPagePaths().map((page) => page.path);
  for (const path of [
    '/motion/presence/guide',
    '/motion/presence/examples',
    '/motion/recipes/dialog',
    '/motion/getting-started',
  ]) {
    assert.ok(paths.includes(path), path);
  }
  assert.ok(!paths.includes('/motion/presence'));
  for (const neutral of [
    '/motion',
    '/motion/glossary',
    '/motion/api',
    '/motion/limits',
    '/motion/roadmap',
    '/motion/loading-and-weight',
  ]) {
    assert.ok(!paths.includes(neutral), neutral);
  }
  assert.ok(paths.every((path) => !path.includes('#')));
  assert.equal(new Set(paths).size, paths.length);
});

test('isFrameworkStub is true for a bare framework-dependent path only', () => {
  for (const stub of [
    '/motion/presence',
    '/motion/presence/guide',
    '/motion/recipes/dialog',
  ]) {
    assert.equal(isFrameworkStub(stub), true, stub);
  }
  for (const page of ['/react/motion/presence/guide', '/motion/glossary']) {
    assert.equal(isFrameworkStub(page), false, page);
  }
});

test("canonicalUrl drops the trailing slash but the root's", () => {
  const site = 'https://ui.udixio.fr/';
  assert.equal(
    canonicalUrl('/react/motion/presence/guide/', site),
    'https://ui.udixio.fr/react/motion/presence/guide',
  );
  assert.equal(canonicalUrl('/', site), 'https://ui.udixio.fr/');
});

test('readingFramework accepts the four ids only', () => {
  assert.equal(readingFramework('svelte'), 'svelte');
  for (const value of ['vue', '', undefined, null]) {
    assert.equal(readingFramework(value), undefined, String(value));
  }
});

test('titles and descriptions name the reading and the tab', () => {
  const presence = need('presence');
  assert.equal(motionTitle(presence, 'svelte'), 'Presence in Svelte · Motion');
  assert.equal(
    motionTitle(presence, 'svelte', 'guide'),
    'Presence guide in Svelte · Motion',
  );
  assert.equal(
    motionTitle(presence, 'svelte', 'examples'),
    'Presence examples in Svelte · Motion',
  );
  assert.equal(motionTitle(need('glossary')), 'Glossary · Motion');
  assert.equal(motionTitle(need('')), 'Motion');
  assert.equal(
    motionDescription(presence, 'svelte'),
    `${presence.summary} ${FRAMEWORK_LINES.svelte}`,
  );
  const guide = motionDescription(presence, 'svelte', 'guide');
  assert.ok(guide.startsWith('The complete guide. '), guide);
  assert.ok(guide.endsWith(FRAMEWORK_LINES.svelte), guide);
  assert.equal(
    FRAMEWORK_LINES.angular,
    'In Angular, with the directives of @udixio/ui-angular.',
  );
});

test('the neutral motion pages are the six of the spec', () => {
  const neutral = MOTION_NEEDS.filter((item) => !item.perFramework).map(
    (item) => item.slug,
  );
  assert.deepEqual([...neutral].sort(), [
    '',
    'api',
    'glossary',
    'limits',
    'loading-and-weight',
    'roadmap',
  ]);
});

test('motionUrl gives the reading of a page, and the default tab of a feature', () => {
  assert.equal(motionUrl('glossary'), '/motion/glossary');
  assert.equal(motionUrl('presence'), '/react/motion/presence/guide');
  assert.equal(
    motionUrl('presence', 'svelte', 'examples'),
    '/svelte/motion/presence/examples',
  );
  assert.equal(
    motionUrl('recipes/dialog', 'html'),
    '/html/motion/recipes/dialog',
  );
});

test('a trailing slash, a query and a hash name the same page', () => {
  assert.equal(
    withFramework('/motion/presence/guide/?x=1#y', 'react'),
    '/react/motion/presence/guide?x=1#y',
  );
  assert.equal(
    withFramework('/motion/layout/#rules', 'svelte'),
    '/svelte/motion/layout/guide#rules',
  );
  assert.equal(isFrameworkStub('/motion/presence/?x=1#y'), true);
  assert.equal(isFrameworkStub('/react/motion/presence/guide/'), false);
  assert.deepEqual(splitMotionPath('/motion/presence/guide/'), {
    slug: 'presence',
    tab: 'guide',
  });
});

test('no retired page or export is referenced', () => {
  const retired = ['scroll', 'page-transitions'];
  for (const item of MOTION_NEEDS) {
    assert.ok(
      !retired.includes(item.slug),
      `${item.slug} is still a need page`,
    );
    for (const related of item.related) {
      assert.ok(
        !retired.includes(related),
        `${item.slug} still relates to ${related}`,
      );
    }
  }
  const api = readFileSync(
    new URL('../src/data/motion-api.json', import.meta.url),
    'utf8',
  );
  assert.doesNotMatch(
    api,
    /"(scrollTo|navigate|connectAstroTransitions|NavigationDirection)"/,
  );
  assert.doesNotMatch(api, /'time'/);
});
