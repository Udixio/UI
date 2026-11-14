import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';

const { NX_BASE, NX_HEAD, GITHUB_OUTPUT } = process.env;
if (!NX_BASE || !NX_HEAD || !GITHUB_OUTPUT)
  throw new Error('NX_BASE, NX_HEAD and GITHUB_OUTPUT are required');

const projects = readFileSync(0, 'utf8').split(/\r?\n/);
const motion = projects.includes('@udixio/motion');
let benchmark = motion;
if (!benchmark) {
  const changed = execFileSync('git', [
    'diff',
    '--name-only',
    '--no-renames',
    '-z',
    NX_BASE,
    NX_HEAD,
    '--',
    '.github/scripts/validate-motion-report.mjs',
    '.github/scripts/validate-motion-report.test.mjs',
    '.github/scripts/select-motion.mjs',
    '.github/scripts/select-motion.test.mjs',
    '.github/workflows/pr-validation.yml',
    '.github/workflows/motion-nightly.yml',
  ]);
  benchmark = changed.length > 0;
}
const searchChanges = execFileSync('git', [
  'diff',
  '--name-only',
  '--no-renames',
  '-z',
  NX_BASE,
  NX_HEAD,
  '--',
  'packages/core',
  'packages/tailwind',
  'packages/theme',
  'packages/motion',
  'packages/ui-angular',
  'packages/ui-react',
  'packages/ui-svelte',
  'apps/doc/src/styles/udixio.generated.css',
  'apps/doc/theme.config.ts',
  'apps/doc/tests/switch-hydration-server.ts',
  'apps/doc/tests/slider-hydration-server.ts',
  'apps/doc/package.json',
  '.github/workflows',
  '.github/scripts',
  'pnpm-lock.yaml',
  'pnpm-workspace.yaml',
  'package.json',
  'nx.json',
]);
const searchMotion = motion || projects.includes('tailwind-integration-tests') || searchChanges.length > 0;
appendFileSync(
  GITHUB_OUTPUT,
  `motion=${motion}\nmotion_benchmark=${benchmark}\nsearch_motion=${searchMotion}\n`,
);
