/**
 * Measures the weight of @udixio/motion and of the motion part of each adapter, and writes size-report.json: the file
 * the documentation prints (apps/doc/src/lib/motion-facts.ts reads it). The budgets of .size-limit.json are not measures:
 * they are the ceilings that `size-limit` enforces, and this report is what the bundles weigh.
 *
 * - Entries: `size-limit --json`, the tool and the bundle of the budget check, gzipped at level 9. Each figure is one
 *   entry alone: its own code and the shared code it imports, so the figures of entries that share code overlap.
 * - Adapters: every module of the motion part of an adapter (lib/motion, and for React the useMotion* hooks of
 *   lib/hooks), bundled with esbuild (ESM, minified, tree-shaken) with `@udixio/*`, `react`, `@angular/*` and `svelte`
 *   external, gzipped at level 9. They are measured on the TypeScript source: Angular's decorators and Svelte's runes are
 *   not compiled by their own compilers, so an application's bundle can differ from these figures.
 *
 * Usage (after `vite build`, or `npx nx build @udixio/motion --skip-sync` from the root):
 *   node scripts/size-report.mjs           writes size-report.json
 *   node scripts/size-report.mjs --check   fails when the committed size-report.json is stale
 * The node test scripts/size-report.test.mjs runs the same comparison.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { gzipSync } from 'node:zlib';

const require = createRequire(import.meta.url);
const packageDir = fileURLToPath(new URL('..', import.meta.url));
const repoDir = fileURLToPath(new URL('../../../', import.meta.url));
export const reportPath = join(packageDir, 'size-report.json');

// The esbuild that the budget check uses: the one @size-limit/esbuild depends on, so both measures agree.
const esbuild = createRequire(require.resolve('@size-limit/esbuild', { paths: [packageDir] }))('esbuild');
const sizeLimitBin = join(dirname(require.resolve('size-limit')), 'bin.js');

const TEST_FILE = /\.(spec|test|integration|fixture)\.|\.d\.ts$/;
const motionModules = (dir, pattern = /\.tsx?$/) =>
  readdirSync(join(repoDir, dir))
    .filter((file) => pattern.test(file) && !TEST_FILE.test(file))
    .sort()
    .map((file) => join(dir, file));

/** The motion part of each adapter, as files of its source. */
export const ADAPTER_FILES = {
  react: [...motionModules('packages/ui-react/src/lib/motion'), ...motionModules('packages/ui-react/src/lib/hooks', /^useMotion.*\.tsx?$/)],
  angular: motionModules('packages/ui-angular/src/lib/motion'),
  svelte: motionModules('packages/ui-svelte/src/lib/motion'),
};

/** The gzipped size, in bytes, of each entry of the budgets, as size-limit measures it. */
function measureEntries() {
  let stdout;
  try {
    stdout = execFileSync(process.execPath, [sizeLimitBin, '--json'], { cwd: packageDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (error) {
    // size-limit exits non-zero when a budget is exceeded, after printing the same JSON.
    if (typeof error.stdout !== 'string' || !error.stdout.trim()) throw error;
    stdout = error.stdout;
  }
  return Object.fromEntries(JSON.parse(stdout).map(({ name, size }) => [name, size]));
}

/** The gzipped size, in bytes, of one adapter's motion part: an esbuild bundle of its files, as one module. */
async function measureAdapter(framework) {
  const contents = ADAPTER_FILES[framework].map((file) => `export * from ${JSON.stringify(join(repoDir, file))};`).join('\n');
  const result = await esbuild.build({
    stdin: { contents, resolveDir: repoDir, sourcefile: `${framework}-motion.ts`, loader: 'ts' },
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'browser',
    target: 'esnext',
    minify: true,
    treeShaking: true,
    jsx: 'automatic',
    logLevel: 'silent',
    external: ['@udixio/*', 'react', 'react-dom', 'react/*', 'react-dom/*', '@angular/*', 'svelte', 'svelte/*'],
    tsconfigRaw: { compilerOptions: { experimentalDecorators: true, useDefineForClassFields: false } },
  });
  return gzipSync(result.outputFiles[0].contents, { level: 9 }).length;
}

/** Measures every entry and every adapter. The result is what size-report.json holds. */
export async function measure() {
  const adapters = {};
  for (const framework of Object.keys(ADAPTER_FILES)) adapters[framework] = await measureAdapter(framework);
  return { generatedBy: 'scripts/size-report.mjs', node: process.version, entries: measureEntries(), adapters };
}

export const render = (report) => `${JSON.stringify(report, null, 2)}\n`;

/**
 * True when the committed sizes differ from the sizes measured now. The Node.js version is recorded for reference and
 * is not compared: a stale file is one whose numbers are no longer the numbers of the package.
 */
export function isStale(committedText, report) {
  const committed = JSON.parse(committedText);
  return !isDeepStrictEqual(committed.entries, report.entries) || !isDeepStrictEqual(committed.adapters, report.adapters);
}

async function main() {
  const report = await measure();
  if (process.argv.includes('--check')) {
    if (isStale(readFileSync(reportPath, 'utf8'), report)) {
      console.error('size-report.json is stale: run `node scripts/size-report.mjs` in packages/motion and commit the file.');
      process.exitCode = 1;
    }
    return;
  }
  writeFileSync(reportPath, render(report));
  const rows = [...Object.entries(report.entries), ...Object.entries(report.adapters).map(([name, bytes]) => [`adapter ${name}`, bytes])];
  for (const [name, bytes] of rows) console.log(`${name.padEnd(20)} ${(bytes / 1000).toFixed(2).padStart(7)} kB`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) await main();
