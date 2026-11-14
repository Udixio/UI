import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

const selector = resolve('.github/scripts/select-motion.mjs');
const watched = [
  '.github/scripts/validate-motion-report.mjs',
  '.github/scripts/validate-motion-report.test.mjs',
  '.github/workflows/pr-validation.yml',
  '.github/workflows/motion-nightly.yml',
  '.github/scripts/select-motion.mjs',
  '.github/scripts/select-motion.test.mjs',
];

function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), 'motion-select-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const git = (...args) =>
    execFileSync('git', args, {
      cwd: dir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  git('init', '-q');
  git('config', 'user.email', 'test@example.com');
  git('config', 'user.name', 'Test');
  for (const path of [...watched, 'unrelated.txt']) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), 'original\n');
  }
  git('add', '.');
  git('commit', '-qm', 'base');
  const base = git('rev-parse', 'HEAD');
  const commit = () => {
    git('add', '-A');
    git('commit', '-qm', 'change');
    return git('rev-parse', 'HEAD');
  };
  const select = (head, projects = '') => {
    const output = join(dir, 'output');
    rmSync(output, { force: true });
    const result = spawnSync(process.execPath, [selector], {
      cwd: dir,
      input: projects,
      encoding: 'utf8',
      env: {
        ...process.env,
        NX_BASE: base,
        NX_HEAD: head,
        GITHUB_OUTPUT: output,
      },
    });
    const values =
      result.status === 0
        ? Object.fromEntries(
            readFileSync(output, 'utf8')
              .trim()
              .split('\n')
              .map((line) => line.split('=')),
          )
        : null;
    return { result, values };
  };
  return { dir, base, commit, select };
}

test('motion affected selects both browser tests and benchmark', (t) => {
  const { base, select } = fixture(t);
  const { result, values } = select(base, '@other/package\n@udixio/motion\n');
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(values, {
    motion: 'true',
    motion_benchmark: 'true',
    search_motion: 'true',
  });
});

test('affected Tailwind integration tests select browser coverage', (t) => {
  const { base, select } = fixture(t);
  const { result, values } = select(base, 'tailwind-integration-tests\n');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(values.search_motion, 'true');
});

for (const path of watched) {
  test(`${path} selects benchmark without selecting browser tests`, (t) => {
    const { dir, commit, select } = fixture(t);
    writeFileSync(join(dir, path), 'changed\n');
    const { result, values } = select(commit());
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(values, {
      motion: 'false',
      motion_benchmark: 'true',
      search_motion: 'true',
    });
  });
}

test('unrelated changes select neither', (t) => {
  const { dir, commit, select } = fixture(t);
  writeFileSync(join(dir, 'unrelated.txt'), 'changed\n');
  const { result, values } = select(commit());
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(values, {
    motion: 'false',
    motion_benchmark: 'false',
    search_motion: 'false',
  });
});

for (const operation of ['delete', 'rename']) {
  test(`${operation} of a watched file selects benchmark`, (t) => {
    const { dir, commit, select } = fixture(t);
    const file = join(dir, watched[0]);
    if (operation === 'delete') rmSync(file);
    else renameSync(file, join(dir, 'renamed.txt'));
    const { result, values } = select(commit());
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(values, {
      motion: 'false',
      motion_benchmark: 'true',
      search_motion: 'true',
    });
  });
}

test('invalid comparison fails rather than skipping the benchmark', (t) => {
  const { select } = fixture(t);
  const { result } = select('not-a-commit');
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /not-a-commit/);
});

for (const path of [
  'packages/core/src/lib/styles/search.style.ts',
  'packages/tailwind/tests/example.ts',
  'packages/motion/public/motion.css',
  'packages/ui-angular/tests/fixtures/search-motion.ts',
  'packages/ui-react/src/Search.tsx',
  'packages/ui-svelte/src/Search.svelte',
  'apps/doc/src/styles/udixio.generated.css',
  'apps/doc/theme.config.ts',
  'packages/theme/src/index.ts',
  'apps/doc/tests/switch-hydration-server.ts',
  'apps/doc/tests/slider-hydration-server.ts',
  'apps/doc/package.json',
]) {
  test(`${path} selects Search motion`, (t) => {
    const { dir, commit, select } = fixture(t);
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), 'changed\n');
    const { result, values } = select(commit());
    assert.equal(result.status, 0, result.stderr);
    assert.equal(values.search_motion, 'true');
  });
}
