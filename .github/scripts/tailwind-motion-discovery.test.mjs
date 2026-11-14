import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { basename, dirname, resolve } from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const root = resolve('packages/tailwind');
const require = createRequire(import.meta.url);
const vitest = resolve(dirname(require.resolve('vitest/package.json')), 'vitest.mjs');
const motionFiles = [
  'search-motion.browser.spec.ts',
  'progress-motion.browser.spec.ts',
  'progress-angular-hydration.browser.spec.ts',
  'progress-react-hydration.browser.spec.tsx',
  'progress-svelte-hydration.browser.spec.ts',
  'slider-motion.browser.spec.ts',
  'switch-motion.browser.spec.ts',
  'slider-adapters.browser.spec.ts',
  'switch-adapters.browser.spec.ts',
  'slider-hydration.browser.spec.tsx',
  'slider-angular-hydration.browser.spec.ts',
  'slider-svelte-hydration.browser.spec.ts',
  'switch-hydration.browser.spec.tsx',
  'switch-angular-hydration.browser.spec.ts',
  'switch-svelte-hydration.browser.spec.ts',
  ...['angular', 'react', 'svelte'].map((name) => `search-${name}.browser.spec.ts`),
];

function discover(config, ...args) {
  const output = execFileSync(process.execPath, [vitest, 'list', '--config', config, '--filesOnly', '--json', ...args], {
    cwd: root,
    encoding: 'utf8',
  });
  return new Set(JSON.parse(output).map(({ file }) => basename(file)));
}

test('browser motion tests run only through the dedicated configuration', () => {
  const standard = discover('vite.config.ts');
  const motion = discover('search-motion.config.mts');
  for (const file of motionFiles) {
    assert.equal(standard.has(file), false, `${file} unexpectedly runs in the standard suite`);
    assert.equal(motion.has(file), true, `${file} missing from the motion suite`);
  }
  assert.ok(standard.has('generate-static-theme-css.spec.ts'), 'standard suite must still include unit tests');
});

test('integration test target excludes browser tests', () => {
  const standard = discover('tests/vitest.config.ts', '--exclude', '**/*.browser.spec.*');
  for (const file of motionFiles) {
    assert.equal(standard.has(file), false, `${file} unexpectedly runs in the integration unit suite`);
  }
  assert.ok(standard.has('theme-provider-reference.spec.ts'), 'integration unit suite must include unit tests');
});
