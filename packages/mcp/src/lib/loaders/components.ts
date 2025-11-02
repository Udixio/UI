import { globby } from 'globby';
import fs from 'node:fs/promises';
import path from 'node:path';

function hereDir() {
  const u = new URL(import.meta.url);
  return path.dirname(u.pathname);
}

function bundledComponentsIndexPath() {
  // Bundled data lives beside this file under ./bundled when running from src or dist
  const candidates = [
    path.resolve(hereDir(), './bundled/components-index.json'),
    path.resolve(hereDir(), '../bundled/components-index.json'),
  ];
  return candidates[0];
}

function bundledDocSrc() {
  const candidates = [
    path.resolve(hereDir(), './bundled/doc-src'),
    path.resolve(hereDir(), '../bundled/doc-src'),
  ];
  return candidates[0];
}

async function pathExists(p: string) {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

export async function loadComponentsIndex() {
  // Use bundled index only (zero-setup)
  const bundledIndex = bundledComponentsIndexPath();
  if (await pathExists(bundledIndex)) {
    const raw = await fs.readFile(bundledIndex, 'utf8');
    return JSON.parse(raw);
  }
  throw new Error('Bundled components-index.json not found. Please install @udixio/mcp package with bundled assets.');
}

export async function loadComponentDoc(name: string) {
  // Heuristique: chercher un fichier MD/MDX/Story/Examples correspondant dans bundled docs
  const base = bundledDocSrc();
  if (!(await pathExists(base))) {
    throw new Error('Bundled docs not found.');
  }
  const patterns = [
    `**/${name}.md*`,
    `**/${name.toLowerCase()}.md*`,
    `**/${name}.stories.@(mdx|tsx)`,
  ];
  const matches = await globby(patterns, { cwd: base, absolute: true });
  return {
    name,
    docs: matches.map((m) => path.relative(base, m)),
  };
}