/*
  Snapshot script to bundle docs, theme, and components index into the npm package.
  This allows @udixio/mcp to run without cloning the monorepo.
*/
import { globby } from 'globby';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const PKG_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(PKG_ROOT, '../..');

const DOC_SRC = path.join(REPO_ROOT, 'apps/doc/src');
const THEME_TS = path.join(REPO_ROOT, 'apps/doc/theme.config.ts');
const THEME_JSON = path.join(REPO_ROOT, 'apps/doc/theme.config.json');
const UI_SRC = path.join(REPO_ROOT, 'packages/ui-react/src');

// Targets for bundled assets
const DIST_BUNDLED = path.join(PKG_ROOT, 'dist/bundled');
const SRC_BUNDLED = path.join(PKG_ROOT, 'src/bundled');

async function ensureDir(p: string) {
  await fs.mkdir(p, { recursive: true });
}

async function writeJSON(file: string, data: any) {
  await ensureDir(path.dirname(file));
  await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf8');
}

async function copyFilePreserve(src: string, destRoot: string, base: string) {
  const rel = path.relative(base, src);
  const dest = path.join(destRoot, rel);
  await ensureDir(path.dirname(dest));
  await fs.copyFile(src, dest);
}

async function snapshotDocs() {
  const patterns = ['**/*.{md,mdx,astro}'];
  const files = await globby(patterns, { cwd: DOC_SRC, absolute: true, dot: false });
  const targetDocDist = path.join(DIST_BUNDLED, 'doc-src');
  const targetDocSrc = path.join(SRC_BUNDLED, 'doc-src');
  await Promise.all([
    ensureDir(targetDocDist),
    ensureDir(targetDocSrc),
  ]);
  for (const file of files) {
    await Promise.all([
      copyFilePreserve(file, targetDocDist, DOC_SRC),
      copyFilePreserve(file, targetDocSrc, DOC_SRC),
    ]);
  }
}

async function snapshotTheme() {
  let theme: any | null = null;
  try {
    const mod = await import(pathToFileURL(THEME_TS).href);
    theme = mod?.default ?? mod?.theme ?? null;
  } catch {}
  if (!theme) {
    try {
      const raw = await fs.readFile(THEME_JSON, 'utf8');
      theme = JSON.parse(raw);
    } catch {}
  }
  if (!theme) {
    // Fallback to empty object to avoid runtime crashes
    theme = { error: 'theme.config not found at build time' };
  }
  await writeJSON(path.join(DIST_BUNDLED, 'theme.json'), theme);
  await writeJSON(path.join(SRC_BUNDLED, 'theme.json'), theme);
}

async function snapshotComponents() {
  const files = await globby(['**/*.{tsx,ts}'], {
    cwd: UI_SRC,
    absolute: true,
  });
  const components: { name: string; file: string }[] = [];
  for (const file of files) {
    const src = await fs.readFile(file, 'utf8');
    const re = /export\s+(?:const|function|class)\s+([A-Z][A-Za-z0-9_]*)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(src))) {
      components.push({ name: m[1], file: path.relative(UI_SRC, file) });
    }
  }
  const index = { count: components.length, components };
  await writeJSON(path.join(DIST_BUNDLED, 'components-index.json'), index);
  await writeJSON(path.join(SRC_BUNDLED, 'components-index.json'), index);
}

async function main() {
  console.log('[snapshot] Bundling docs, theme, and components index...');
  await ensureDir(DIST_BUNDLED);
  await ensureDir(SRC_BUNDLED);
  await snapshotDocs();
  await snapshotTheme();
  await snapshotComponents();
  console.log('[snapshot] Done.');
}

main().catch((e) => {
  console.error('[snapshot] failed:', e);
  process.exit(1);
});
