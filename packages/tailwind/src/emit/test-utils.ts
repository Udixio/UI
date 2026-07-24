import { compile } from '@tailwindcss/node';
import { mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig, FontPlugin, loader } from '@udixio/theme';
import { TailwindPlugin } from '../node/tailwind.plugin';

/**
 * The single reference config used by all emit tests.
 *
 * Deliberately uses the NODE `TailwindPlugin` (not `ssr: true` / the browser
 * plugin) because only the node, non-SSR code path emits the
 * `@plugin "@udixio/tailwind" { ... }` directive that wires up the actual
 * typography/state-layer/shadow/animation utilities (`.text-display-large`,
 * `.state-primary`, `.shadow-1`, ...). `ssr: true` (as used by
 * `generateThemeCss` for SSR class-name generation) intentionally emits only
 * CSS color variables and skips `@plugin`/`@theme`/filesystem writes — using
 * it here would characterize a small slice of current behavior, not the full
 * resolved CSS this golden is meant to protect.
 *
 * `styleFilePath` is pinned to a directory under the repo's own
 * `.tmp-test/` (not `os.tmpdir()` and never a real project file) so the
 * plugin's node-only file-write side effect stays fully sandboxed: no
 * filesystem scan for a host project's CSS entry point, no mutation of any
 * real file, ever.
 */
export function referenceConfig(styleFilePath: string) {
  return defineConfig({
    sourceColor: '#6750A4',
    plugins: [new FontPlugin({}), new TailwindPlugin({ styleFilePath })],
  });
}

/** Runs the theme and returns the TailwindPlugin's generated CSS string. */
export async function generateReferenceCss(): Promise<string> {
  const { mkdirSync, rmSync } = await import('node:fs');
  const root = join(__dirname, '..', '..', '.tmp-test');
  mkdirSync(root, { recursive: true });
  const dir = mkdtempSync(join(root, 'ref-'));
  try {
    const config = referenceConfig(join(dir, 'udixio-generated.css'));
    const api = await loader(config, false);
    await api.load();
    return api.plugins.getPlugin(TailwindPlugin).getInstance().outputCss;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** Compiles `@import "tailwindcss"` + generated CSS, returns resolved CSS for candidates. */
export async function buildResolvedCss(
  generatedCss: string,
  candidates: string[],
): Promise<string> {
  // The temp dir MUST live inside the repo: compile() resolves
  // `@import "tailwindcss"` from `base`, and an os.tmpdir() base fails with
  // "Can't resolve 'tailwindcss'".
  const { writeFileSync, mkdirSync, rmSync } = await import('node:fs');
  const root = join(__dirname, '..', '..', '.tmp-test');
  mkdirSync(root, { recursive: true });
  const dir = mkdtempSync(join(root, 'emit-'));
  try {
    writeFileSync(join(dir, 'generated.css'), generatedCss);
    const entry = `@import "tailwindcss";\n@import "./generated.css";`;
    const { build } = await compile(entry, { base: dir, onDependency: () => {} });
    return build(candidates);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** Candidate utility classes exercised by the golden tests. */
export const GOLDEN_CANDIDATES = [
  'text-display-large',
  'text-body-medium',
  'lg:text-display-large',
  'state-primary',
  'state-layer',
  'shadow-1',
  'hover:shadow-2',
  'bg-primary',
  'text-on-surface',
];
