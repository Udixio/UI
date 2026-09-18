import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
} from 'node:fs';
import { join } from 'node:path';
import { defineConfig } from '../node/define-config';
import { main as tailwind } from '../main';
import udixio, { VIRTUAL_CSS_ID } from './index.node';
import { hooks } from './test-utils';

/** a Rollup PluginContext with the one method buildStart uses */
const context = () => ({ addWatchFile: () => undefined });

describe('udixio() — node build', () => {
  let dir: string;
  let cwd: string;

  beforeEach(() => {
    const root = join(__dirname, '..', '..', '.tmp-test');
    mkdirSync(root, { recursive: true });
    dir = mkdtempSync(join(root, 'vite-'));
    cwd = process.cwd();
    process.chdir(dir);
  });

  afterEach(() => {
    process.chdir(cwd);
    rmSync(dir, { recursive: true, force: true });
  });

  it('uses the config passed in instead of loading a file', async () => {
    const plugin = udixio({
      config: defineConfig({ sourceColor: '#6750A4' }),
    });
    await hooks(plugin).buildStart.call(context());
    expect(existsSync(join(dir, 'udixio.generated.css'))).toBe(true);
  });

  it('serves the virtual CSS but leaves udixio.generated.css to the file on disk', async () => {
    const plugin = udixio({
      config: defineConfig({ sourceColor: '#6750A4' }),
    });
    expect(await hooks(plugin).resolveId(VIRTUAL_CSS_ID)).toBe(VIRTUAL_CSS_ID);
    expect(await hooks(plugin).resolveId('./udixio.generated.css')).toBeNull();
    const css = await hooks(plugin).load(VIRTUAL_CSS_ID);
    expect(css).toContain('@theme {');
    expect(css).toContain('@plugin "@udixio/tailwind";');
    // generating the virtual CSS never writes the file
    expect(existsSync(join(dir, 'udixio.generated.css'))).toBe(false);
  });

  it('keeps the dev-server hooks and the Tailwind module', () => {
    const plugin = udixio({ config: defineConfig({ sourceColor: '#6750A4' }) });
    expect(plugin).toHaveProperty('configureServer');
    expect(plugin).toHaveProperty('handleHotUpdate');
    expect(plugin.tailwind).toEqual({ '@udixio/tailwind': tailwind });
  });
});
