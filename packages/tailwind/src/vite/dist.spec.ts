/**
 * `@udixio/tailwind/vite` as published: each entry built the way `vite build`
 * does, then imported as a package consumer would — the node one from Node
 * against `dist/` of its dependencies, the browser one bundled under the
 * `browser` condition with everything inlined, so that any Node dependency
 * reached statically shows up as an import the bundle cannot satisfy.
 *
 * Source-level specs cannot cover the on-disk config: vitest resolves
 * `@udixio/theme` to its sources while jiti loads `theme.config.ts` through
 * Node (`dist/`), which puts the two sides of `instanceof` in different
 * module graphs. For the same reason the browser bundle carries its own
 * `defineConfig`: a config built from the sources would be foreign to it.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build, type Rollup } from 'vite';
import type { Hooks } from './test-utils';

const pkg = join(__dirname, '..', '..');
let out: string;

/** the entry built as `dist/vite.<browser|node>.js` is, returned as a chunk */
async function bundle(
  entry: string,
  options: { browser: boolean },
): Promise<Rollup.OutputChunk> {
  const result = (await build({
    configFile: false,
    logLevel: 'silent',
    root: pkg,
    resolve: options.browser ? { conditions: ['browser'] } : undefined,
    build: {
      ssr: !options.browser,
      write: false,
      minify: false,
      lib: { entry, formats: ['es'], fileName: 'bundle' },
      rollupOptions: {
        // the node build keeps its dependencies external, as published; the
        // browser build inlines them all, so that its imports list is what
        // it cannot provide for itself
        external: options.browser
          ? ['tailwindcss/plugin']
          : ['@udixio/theme', 'tailwindcss/plugin', 'text-case', 'pathe', 'vite'],
      },
    },
  })) as Rollup.RollupOutput[];
  return result[0].output[0];
}

async function load(chunk: Rollup.OutputChunk, name: string) {
  const file = join(out, name);
  writeFileSync(file, chunk.code);
  return import(pathToFileURL(file).href);
}

beforeAll(() => {
  const root = join(pkg, '.tmp-test');
  mkdirSync(root, { recursive: true });
  out = mkdtempSync(join(root, 'dist-'));
});

afterAll(() => {
  rmSync(out, { recursive: true, force: true });
});

describe('dist/vite.browser.js', () => {
  let chunk: Rollup.OutputChunk;
  let mod: { default: (o: object) => Hooks; defineConfig: (c: object) => object };

  beforeAll(async () => {
    // the plugin entry plus `defineConfig`, from the same bundle
    const entry = join(out, 'browser.entry.ts');
    writeFileSync(
      entry,
      `export { default } from '${join(pkg, 'src/vite/index.browser.ts')}';
export { defineConfig } from '${join(pkg, 'src/index.browser.ts')}';
`,
    );
    chunk = await bundle(entry, { browser: true });
    mod = await load(chunk, 'vite.browser.js');
  }, 60_000);

  it('reaches no Node dependency statically', () => {
    expect(chunk.imports).toEqual(['tailwindcss/plugin']);
    expect(chunk.dynamicImports).toEqual([]);
    expect(chunk.code).not.toMatch(/^import[^\n]*["']node:/m);
  });

  it('serves the static CSS for an import of udixio.generated.css', async () => {
    const config = mod.defineConfig({ sourceColor: '#6750A4' });
    const udixio = mod.default({ config });
    const id = await udixio.resolveId('./udixio.generated.css');
    const css = await udixio.load(id as string);
    expect(css).toContain('@theme {');
    expect(css).toContain('@plugin "@udixio/tailwind";');
  });
});

describe('dist/vite.node.js', () => {
  let file: string;

  beforeAll(async () => {
    const chunk = await bundle('src/vite/index.node.ts', { browser: false });
    file = join(out, 'vite.node.js');
    writeFileSync(file, chunk.code);
  }, 60_000);

  // In a child process: vitest would otherwise route the bundle's own
  // `@udixio/theme` import to the sources, away from jiti's `dist/`.
  it('loads theme.config from disk on buildStart, writes the file and watches the config', () => {
    const dir = mkdtempSync(join(out, 'project-'));
    writeFileSync(
      join(dir, 'theme.config.ts'),
      `import { defineConfig } from '@udixio/tailwind';
export default defineConfig({ sourceColor: '#6750A4', outFile: 'src/udixio.generated.css' });
`,
    );
    writeFileSync(
      join(dir, 'run.mjs'),
      `import udixio from '${pathToFileURL(file).href}';
const watched = [];
await udixio().buildStart.call({ addWatchFile: (id) => watched.push(id) }, {});
console.log(JSON.stringify(watched));
`,
    );
    const stdout = execFileSync(process.execPath, ['run.mjs'], {
      cwd: dir,
      encoding: 'utf8',
    });

    expect(
      readFileSync(join(dir, 'src/udixio.generated.css'), 'utf8'),
    ).toContain('--color-primary:');
    expect(JSON.parse(stdout.trim())).toEqual([join(dir, 'theme.config.ts')]);
  });
});
