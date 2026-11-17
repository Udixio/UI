import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Stats } from 'node:fs';

// Mock fs module
vi.mock('node:fs/promises', () => ({
  default: {
    stat: vi.fn(),
    readFile: vi.fn(),
  },
}));

import fs from 'node:fs/promises';
import { loadMotionManifest, MOTION_MANIFEST_SECTIONS } from './motion';

describe('Motion manifest loader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reads the manifest bundled with the package', async () => {
    const manifest = { version: 1, verbs: {}, presets: {} };
    vi.mocked(fs.stat).mockResolvedValue({} as Stats);
    vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(manifest));

    await expect(loadMotionManifest()).resolves.toEqual(manifest);
    expect(vi.mocked(fs.readFile).mock.calls[0][0]).toMatch(/motion-manifest\.json$/);
  });

  it('says how to repair the install when the bundle has no manifest', async () => {
    vi.mocked(fs.stat).mockRejectedValue(new Error('ENOENT'));

    await expect(loadMotionManifest()).rejects.toThrow('Bundled motion-manifest.json not found');
  });

  it('accepts exactly the top-level sections of the manifest', () => {
    expect(MOTION_MANIFEST_SECTIONS).toEqual([
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
    ]);
  });
});
