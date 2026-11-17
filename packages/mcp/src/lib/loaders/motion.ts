import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** The top-level sections of the motion manifest, in the order the manifest lists them. */
export const MOTION_MANIFEST_SECTIONS = [
  'version',
  'domains',
  'envelope',
  'spec',
  'deferredDomains',
  'constraints',
  'defaults',
  'reserved',
  'verbs',
  'presets',
  'tokens',
  'entries',
] as const;

export type MotionManifest = Record<string, unknown>;

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

async function resolveBundledFile(relativePath: string): Promise<string> {
  const candidates = [
    path.resolve(hereDir(), 'bundled', relativePath),
    path.resolve(hereDir(), '..', 'bundled', relativePath),
  ];
  for (const c of candidates) {
    if (await pathExists(c)) return c;
  }
  return candidates[0];
}

/** The motion manifest of `@udixio/motion`, copied into the package at build time by `scripts/snapshot.ts`. */
export async function loadMotionManifest(): Promise<MotionManifest> {
  const file = await resolveBundledFile('motion-manifest.json');
  if (!(await pathExists(file))) {
    throw new Error(
      'Bundled motion-manifest.json not found. Please install @udixio/mcp package with bundled assets.',
    );
  }
  return JSON.parse(await fs.readFile(file, 'utf8')) as MotionManifest;
}
