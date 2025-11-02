import path from 'node:path';
import fs from 'node:fs/promises';

function hereDir() {
  const u = new URL(import.meta.url);
  return path.dirname(u.pathname);
}

function bundledThemePath() {
  const candidates = [
    path.resolve(hereDir(), './bundled/theme.json'),
    path.resolve(hereDir(), '../bundled/theme.json'),
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

export async function loadThemeTokens() {
  const bundled = bundledThemePath();
  if (await pathExists(bundled)) {
    const raw = await fs.readFile(bundled, 'utf8');
    return JSON.parse(raw);
  }
  throw new Error('Bundled theme.json not found.');
}