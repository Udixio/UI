import { globby } from 'globby';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function hereDir() {
  return path.dirname(fileURLToPath(import.meta.url));
}

async function pathExists(p: string) {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

async function resolveBundledPath(relativePath: string): Promise<string> {
  const candidates = [
    path.resolve(hereDir(), 'bundled', relativePath),
    path.resolve(hereDir(), '..', 'bundled', relativePath),
  ];
  for (const c of candidates) {
    if (await pathExists(c)) return c;
  }
  return candidates[0];
}

export async function loadComponentsIndex() {
  const bundledIndex = await resolveBundledPath('components-index.json');
  if (await pathExists(bundledIndex)) {
    const raw = await fs.readFile(bundledIndex, 'utf8');
    return JSON.parse(raw);
  }
  throw new Error('Bundled components-index.json not found. Please install @udixio/mcp package with bundled assets.');
}

export async function loadComponentDoc(name: string) {
  const base = await resolveBundledPath('doc-src');
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