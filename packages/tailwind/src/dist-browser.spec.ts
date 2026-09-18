/**
 * `dist/browser.js` and `dist/vite.browser.js` as published: the browser
 * entries built with the package's own `vite.config.ts`, then checked the
 * way a browser bundler that fetches npm packages whole would see them —
 * nothing to resolve beyond `@udixio/theme` itself (its own browser build).
 * The node entries are built the same way and keep their dependencies
 * external.
 *
 * The bundle runs in a child process under `--conditions=browser`, so that
 * `@udixio/theme` resolves to `dist/browser.js` of the linked package, as it
 * does for a consumer, and not to the sources vitest would substitute.
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

describe.each(['browser.js', 'vite.browser.js'])('dist/%s', (entry) => {
  it('imports no package but @udixio/theme', async () => {
    expect(
      (await packagesReachedBy(entry)).filter((id) => id !== '@udixio/theme'),
    ).toEqual([]);
  });
});

describe('dist/browser.js', () => {
  it('generates the static theme CSS under --conditions=browser', () => {
    const dir = mkdtempSync(join(out, 'run-'));
    writeFileSync(
      join(dir, 'run.mjs'),
      `import { defineConfig, generateStaticThemeCss } from '${pathToFileURL(join(out, 'browser.js')).href}';
console.log(await generateStaticThemeCss(defineConfig({ sourceColor: '#6750A4' })));
`,
    );
    const css = execFileSync(
      process.execPath,
      ['--conditions=browser', 'run.mjs'],
      { cwd: dir, encoding: 'utf8' },
    );
    expect(css).toContain('@theme {');
    expect(css).toContain('--color-primary:');
    expect(css).toContain('@plugin "@udixio/tailwind";');
  });
});

describe('dist/node.js', () => {
  it('keeps its dependencies external', async () => {
    const reached = await packagesReachedBy('node.js');
    for (const dep of ['@udixio/theme', 'pathe', 'tailwindcss/plugin', 'text-case']) {
      expect(reached).toContain(dep);
    }
    expect(await packagesReachedBy('vite.node.js')).toContain('@udixio/theme');
  });
});
