import { globby } from 'globby';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

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

async function resolveDocBase(): Promise<string> {
  const bundled = await resolveBundledPath('doc-src');
  if (await pathExists(bundled)) return bundled;
  throw new Error('Bundled documentation not found.');
}

export async function searchDocs(query: string, limit = 10) {
  const DOC_BASE = await resolveDocBase();
  const files = await globby(['**/*.{md,mdx,astro}'], {
    cwd: DOC_BASE,
    absolute: true,
  });
  const scored: {
    file: string;
    score: number;
    title?: string;
    snippet?: string;
  }[] = [];
  for (const f of files) {
    const text = await fs.readFile(f, 'utf8');
    const { content, data } = matter(text);
    const score =
      (content.match(new RegExp(query, 'ig')) || []).length +
      (JSON.stringify(data).match(new RegExp(query, 'ig')) || []).length;
    if (score > 0) {
      scored.push({
        file: path.relative(DOC_BASE, f),
        score,
        title: (data as any).title,
        snippet: content.slice(0, 240),
      });
    }
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

export async function getDocByPath(relPath: string) {
  const DOC_BASE = await resolveDocBase();
  const full = path.join(DOC_BASE, relPath);
  const content = await fs.readFile(full, 'utf8');
  const mimeType = relPath.endsWith('.astro')
    ? 'text/x-astro'
    : 'text/markdown';
  return { mimeType, content };
}