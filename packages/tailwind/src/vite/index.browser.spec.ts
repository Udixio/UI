import { describe, expect, it } from 'vitest';
import { defineConfig } from '../browser/define-config';
import { main as tailwind } from '../main';
import udixio, { VIRTUAL_CSS_ID } from './index.browser';
import { hooks } from './test-utils';

const config = defineConfig({ sourceColor: '#6750A4' });

describe('udixio() — browser build', () => {
  it('requires the config to be passed in', () => {
    expect(() => udixio()).toThrow(/config/);
  });

  it('serves the static theme CSS for the virtual id', async () => {
    const plugin = udixio({ config });
    const id = await hooks(plugin).resolveId(VIRTUAL_CSS_ID);
    expect(id).toBe(VIRTUAL_CSS_ID);
    const css = await hooks(plugin).load(id as string);
    expect(css).toContain('@theme {');
    expect(css).toContain('@plugin "@udixio/tailwind";');
  });

  it('serves the same CSS for an import of udixio.generated.css', async () => {
    const plugin = udixio({ config });
    expect(
      await hooks(plugin).resolveId('./udixio.generated.css', '/src/app.css'),
    ).toBe(VIRTUAL_CSS_ID);
    expect(await hooks(plugin).resolveId('/src/udixio.generated.css')).toBe(
      VIRTUAL_CSS_ID,
    );
    expect(await hooks(plugin).resolveId('./other.css')).toBeNull();
  });

  it('honours a custom outFile basename', async () => {
    const plugin = udixio({
      config: defineConfig({ sourceColor: '#6750A4', outFile: 'src/theme.css' }),
    });
    expect(await hooks(plugin).resolveId('./theme.css')).toBe(VIRTUAL_CSS_ID);
    expect(await hooks(plugin).resolveId('./udixio.generated.css')).toBeNull();
  });

  it('exposes the Tailwind JS plugin for engines without Node', () => {
    const plugin = udixio({ config });
    expect(plugin.tailwind).toEqual({ '@udixio/tailwind': tailwind });
  });

  it('defines no dev-server hooks', () => {
    const plugin = udixio({ config });
    expect(plugin).not.toHaveProperty('configureServer');
    expect(plugin).not.toHaveProperty('handleHotUpdate');
  });
});
