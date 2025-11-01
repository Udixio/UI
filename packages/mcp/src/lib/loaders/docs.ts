import { globby } from 'globby';
import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';

const ROOT = process.env.UDIXIO_ROOT || process.cwd();
const DOC_SRC = process.env.UDIXIO_DOC_SRC || path.join(ROOT, 'apps/doc/src');

export async function searchDocs(query: string, limit = 10) {
  const files = await globby(['**/*.{md,mdx,astro}'], {
    cwd: DOC_SRC,
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
        file: path.relative(DOC_SRC, f),
        score,
        title: data.title,
        snippet: content.slice(0, 240),
      });
    }
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

export async function getDocByPath(relPath: string) {
  const full = path.join(DOC_SRC, relPath);
  const content = await fs.readFile(full, 'utf8');
  const mimeType = relPath.endsWith('.astro')
    ? 'text/x-astro'
    : 'text/markdown';
  return { mimeType, content };
}