/**
 * `dist/browser.js` as published: the browser entry built with the package's
 * own `vite.config.ts`, then checked the way a browser bundler that fetches
 * npm packages whole would see it — self-contained, nothing to resolve
 * beyond itself. The node entry is built the same way and must keep its
 * Node dependencies external.
 *
 * The bundle is exercised in a child process: vitest would otherwise route
 * the output's module graph through its own transform pipeline.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { isAbsolute, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  build,
  createBuilder,
  loadConfigFromFile,
  mergeConfig,
  type Rollup,
  type UserConfig,
} from 'vite';

const pkg = join(__dirname, '..');
let out: string;

/**
 * Every package an ES entry reaches, statically or dynamically, through its
 * local chunks: the entry is bundled once more with bare specifiers left
 * external, so the result is what a consumer's bundler would have to resolve.
 */
async function packagesReachedBy(entry: string): Promise<string[]> {
  const result = (await build({
    configFile: false,
    logLevel: 'silent',
    root: out,
    build: {
      write: false,
      minify: false,
      lib: { entry: join(out, entry), formats: ['es'], fileName: 'probe' },
      rollupOptions: {
        external: (id) => !id.startsWith('.') && !isAbsolute(id),
      },
    },
  })) as Rollup.RollupOutput[];
  const chunk = result[0].output[0];
  // rolldown leaves external dynamic imports out of `dynamicImports`
  const dynamic = [...chunk.code.matchAll(/\bimport\(\s*["']([^"'./][^"']*)["']\s*\)/g)].map(
    (m) => m[1],
  );
  return [...new Set([...chunk.imports, ...chunk.dynamicImports, ...dynamic])].sort();
}

beforeAll(async () => {
  const root = join(pkg, '.tmp-test');
  mkdirSync(root, { recursive: true });
  out = mkdtempSync(join(root, 'dist-'));

  // the real config, minus the plugins that only cost time here (types, stats)
  const loaded = await loadConfigFromFile(
    { command: 'build', mode: 'production' },
    join(pkg, 'vite.config.ts'),
    pkg,
  );
  const config = loaded!.config as UserConfig;
  config.plugins = (config.plugins ?? []).filter(
    (p) => !(p && 'name' in p && /^(vite:dts|visualizer)$/.test(p.name)),
  );
  // `vite build` as the package runs it: every environment, through `builder`
  const builder = await createBuilder(
    mergeConfig(config, {
      configFile: false,
      logLevel: 'silent',
      build: { outDir: out, reportCompressedSize: false },
    }),
  );
  await builder.buildApp();
}, 120_000);

afterAll(() => {
  rmSync(out, { recursive: true, force: true });
});

describe('dist/browser.js', () => {
  it('imports no package: awilix and material-color-utilities are inlined', async () => {
    expect(await packagesReachedBy('browser.js')).toEqual([]);
  });

  it('builds a theme under --conditions=browser, resolving nothing else', () => {
    const dir = mkdtempSync(join(out, 'run-'));
    writeFileSync(
      join(dir, 'run.mjs'),
      `import { loader, defineConfig } from '${pathToFileURL(join(out, 'browser.js')).href}';
const api = await loader(defineConfig({ sourceColor: '#6750A4' }));
console.log(JSON.stringify({ primary: api.colors.get('primary').hex}));
`,
    );
    const stdout = execFileSync(
      process.execPath,
      ['--conditions=browser', 'run.mjs'],
      { cwd: dir, encoding: 'utf8' },
    );
    expect(JSON.parse(stdout.trim()).primary).toMatch(/^#[0-9a-f]{6}$/i);
  });
});

describe('dist/node.js', () => {
  it('keeps its Node dependencies external', async () => {
    const reached = await packagesReachedBy('node.js');
    for (const dep of ['pathe', 'jiti', 'unplugin', 'awilix']) {
      expect(reached).toContain(dep);
    }
    expect(await packagesReachedBy('bin.js')).toContain('commander');
  });
});
