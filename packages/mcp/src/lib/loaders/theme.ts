import path from 'node:path';
import fs from 'node:fs/promises';

const ROOT = process.env.UDIXIO_ROOT || process.cwd();
const DOC_APP = process.env.UDIXIO_DOC_ROOT || path.join(ROOT, 'apps/doc');

export async function loadThemeTokens() {
  const tsPath = path.join(DOC_APP, 'theme.config.ts');
  const jsonPath = path.join(DOC_APP, 'theme.config.json');
  try {
    // Essayer .ts (ESM dynamique)
    const mod = await import(pathToFileUrl(tsPath).href).catch(() => null);
    if (mod && (mod.default || mod.theme)) {
      return mod.default ?? mod.theme;
    }
  } catch {}
  // Fallback JSON
  try {
    const raw = await fs.readFile(jsonPath, 'utf8');
    return JSON.parse(raw);
  } catch {}
  throw new Error('Aucun theme.config trouvé (ts ou json)');
}

function pathToFileUrl(p: string) {
  const { pathToFileURL } = require('node:url');
  return pathToFileURL(p);
}