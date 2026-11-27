// The shape of the motion examples shown beside their preview (split blocks): checked on their sources, no browser.
// Review 7: Q1 (Getting started shows its attachment above the fold), Q2 + B6 (the equalizer), B7 (one container).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const root = new URL('../src/', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');
const lines = source => source.replace(/\n$/, '').split('\n');
const FILES = {
  html: name => `examples/html/${name}.html`,
  react: name => `examples/react/${name}.tsx`,
  angular: name => `examples/angular/${name}.ts`,
  svelte: name => `examples/svelte/${name}.svelte`,
};
/** The split code column shows about 54 characters at 1440 px (task-template.md §2): a longer line wraps. */
const MEASURE = 56;
/** A split code of 31 lines or more is folded to 24 (CodePreview, SPLIT_CODE_CAP_FROM). */
const FOLD = 24;

const assertMeasure = (path, source) => {
  for (const [index, line] of lines(source).entries()) {
    assert.ok(line.length <= MEASURE, `${path}:${index + 1} is ${line.length} characters (at most ${MEASURE})`);
  }
};

test('Getting started: the file of step 3 shows its attachment above the fold, and step 2 is a module of its own', () => {
  const attach = {
    html: /data-motion="toast"/,
    react: /<Motion\b[^>]*$|name="toast"/,
    angular: /udxMotion="toast"/,
    svelte: /motion\('toast'\)/,
  };
  for (const [framework, file] of Object.entries(FILES)) {
    const path = file('motion-getting-started');
    const source = read(path);
    assertMeasure(path, source);
    const line = lines(source).findIndex(text => attach[framework].test(text)) + 1;
    assert.ok(line > 0 && line <= FOLD - 2, `${path}: the attachment is on line ${line}, under the fold of ${FOLD} lines`);
    // The toast stays until Undo: no timer (WCAG 2.2.1, an action must not leave by itself).
    assert.doesNotMatch(source, /setTimeout/, `${path}: the toast still leaves on a timer`);
    if (framework === 'html') {
      // HTML keeps one file: the definition is in its module script.
      assert.match(source, /defineMotion\('toast'/, path);
      continue;
    }
    // The definition is not in the demo: it imports the module of step 2.
    assert.doesNotMatch(source, /defineMotion/, `${path}: the definition of step 2 is still in the demo`);
    assert.match(source, /^\s*import '\.\/motion-toast';( \/\/ .*)?$/m, `${path}: the demo does not import the module of step 2`);
    const module = `examples/${framework}/motion-toast.ts`;
    assert.ok(existsSync(new URL(module, root)), `${module} is missing`);
    assertMeasure(module, read(module));
    assert.match(read(module), /defineMotion\('toast'/, module);
  }
  // Step 2 shows the module itself, not a copy of it.
  assert.match(read('pages/motion/getting-started.astro'), /motion-toast\.ts\?raw/);
});

test('Loop: the equalizer beats every 800, 1100 and 1400 ms, from one definition, in every framework', () => {
  for (const file of Object.values(FILES)) {
    const path = file('motion-loop');
    const source = read(path);
    assertMeasure(path, source);
    assert.equal(source.match(/verb: 'loop'/g)?.length, 1, `${path}: the three beats are not one definition`);
    for (const duration of [800, 1100, 1400]) assert.match(source, new RegExp(`\\b${duration}\\b`), `${path}: no beat of ${duration} ms`);
    assert.doesNotMatch(source, /duration\.(medium4|long3|extraLong1)/, `${path}: a beat still takes a duration token`);
  }
});

test('Values and Sequences: every live example sits beside its code (split), and its code fits the column', () => {
  for (const page of ['values', 'sequences']) {
    const source = read(`pages/motion/${page}.astro`);
    const usages = [...source.matchAll(/<MotionUsage\b([^>]*)>/g)].map(([, attributes]) => attributes);
    const live = usages.filter(attributes => !/live=\{false\}/.test(attributes));
    assert.ok(live.length >= 2, `/motion/${page}: ${live.length} live examples`);
    for (const attributes of live) {
      assert.match(attributes, /layout="split"/, `/motion/${page}: <MotionUsage${attributes}> keeps the Preview / Code switch`);
    }
  }
  for (const name of ['motion-counters-plays', 'motion-sequences-timeline']) {
    for (const file of Object.values(FILES)) assertMeasure(file(name), read(file(name)));
  }
});
