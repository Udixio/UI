// No browser: node --test tests/motion-snippets.test.mjs
// The root page's code tiles show excerpts of the need pages' examples (src/examples/motion-snippets/<need>.ts). These
// tests hold the excerpt rule: every line is copied from its example, and the lines fit the tile.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { MOTION_NEEDS } from '../src/lib/motion-nav.ts';

const examples = fileURLToPath(new URL('../src/examples/', import.meta.url));
const snippetsDir = fileURLToPath(new URL('../src/examples/motion-snippets/', import.meta.url));

/** The example file each snippet excerpts, by need slug: `examples/<framework>/<name>.<extension>`. */
const EXAMPLE_OF = {
  lists: 'motion-list',
  presence: 'motion-presence',
  emphasis: 'motion-emphasis',
  'shared-elements': 'motion-shared',
  layout: 'motion-layout',
  gestures: 'motion-gesture',
  'page-transitions': 'motion-pages',
  reveal: 'motion-reveal',
  scrub: 'motion-scrub',
  scroll: 'motion-scroll',
  sequences: 'motion-sequence',
  values: 'motion-pointer',
  counters: 'motion-values',
  text: 'motion-text',
  svg: 'motion-svg',
  loop: 'motion-loop',
  tokens: 'motion-tokens',
  scopes: 'motion-scopes',
  animate: 'motion-animate',
  accessibility: 'motion-policy',
};

const FRAMEWORKS = { html: 'html', react: 'tsx', angular: 'ts', svelte: 'svelte' };

/** The measured rule (decisions, after task 3): at most 44 characters a line, indentation included. */
const MAX_LINE = 44;
/** The measured rule: at most 12 lines in a feature tile, at most 10 in a regular one. */
const MAX_LINES = { feature: 12, regular: 10 };

/** A line that stands for what was left out: it is not in the example, and is not counted against it. */
const isElision = line => line.trim().startsWith('// …') || line.trim().startsWith('<!-- …');

/** The four snippets of a need, read from the exports of its module: `export const html = \`…\`;` and so on. */
function snippetsOf(slug) {
  const source = readFileSync(`${snippetsDir}${slug}.ts`, 'utf8');
  const unescape = text => text.replace(/\\(.)/g, '$1');
  const found = {};
  for (const match of source.matchAll(/export const (\w+) = `((?:[^`\\]|\\.)*)`;/gs)) {
    found[match[1]] = unescape(match[2]);
  }
  return found;
}

const needs = MOTION_NEEDS.filter(need => need.scene);
const slugs = needs.map(need => need.slug);
const snippetFiles = readdirSync(snippetsDir).filter(file => file.endsWith('.ts')).map(file => file.slice(0, -3));

test('every root-page tile has a snippet file, and every snippet file belongs to a tile', () => {
  assert.deepEqual([...snippetFiles].sort(), [...slugs].sort());
  assert.deepEqual(Object.keys(EXAMPLE_OF).sort(), [...slugs].sort());
});

for (const need of needs) {
  test(`${need.slug}: the four snippets are excerpts of their example, and fit the tile`, () => {
    const snippets = snippetsOf(need.slug);
    const maxLines = need.feature ? MAX_LINES.feature : MAX_LINES.regular;
    for (const [framework, extension] of Object.entries(FRAMEWORKS)) {
      assert.ok(snippets[framework] !== undefined, `${need.slug}: no ${framework} snippet`);
      const lines = snippets[framework].split('\n');
      assert.ok(lines.length <= maxLines, `${need.slug}/${framework}: ${lines.length} lines, at most ${maxLines}`);
      for (const line of lines) {
        assert.ok(line.length <= MAX_LINE, `${need.slug}/${framework}: ${line.length} characters in ${JSON.stringify(line)}, at most ${MAX_LINE}`);
      }

      const example = `${examples}${framework}/${EXAMPLE_OF[need.slug]}.${extension}`;
      assert.ok(existsSync(example), `${need.slug}/${framework}: no example file ${example}`);
      const exampleLines = new Set(readFileSync(example, 'utf8').split('\n').map(line => line.trim()));
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed === '' || isElision(line)) continue;
        assert.ok(exampleLines.has(trimmed), `${need.slug}/${framework}: ${JSON.stringify(trimmed)} is not a line of ${EXAMPLE_OF[need.slug]}.${extension}`);
      }
    }
  });
}
