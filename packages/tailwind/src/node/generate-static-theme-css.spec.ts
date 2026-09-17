import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig, FontPlugin } from '@udixio/theme';
import { TailwindPlugin } from './tailwind.plugin';
import { generateStaticThemeCss } from './generate-static-theme-css';

describe('generateStaticThemeCss', () => {
  function config(outFile?: string) {
    return defineConfig({
      sourceColor: '#6750A4',
      plugins: [new FontPlugin({}), new TailwindPlugin({ outFile })],
    });
  }

  it('returns the full static CSS (colors, fonts, state layers, shadows, @plugin)', async () => {
    const css = await generateStaticThemeCss(config());

    expect(css).toContain('@theme {');
    expect(css).toContain('--color-primary:');
    expect(css).toContain('--font-');
    expect(css).toContain('@utility state-');
    expect(css).toContain('@utility shadow-1');
    expect(css).toContain('@plugin "@udixio/tailwind";');
  });

  it('never writes to the filesystem, even when outFile is set', async () => {
    const outFile = join(
      __dirname,
      '..',
      '..',
      '.tmp-test',
      `never-written-${Date.now()}.css`,
    );
    await generateStaticThemeCss(config(outFile));
    expect(existsSync(outFile)).toBe(false);
    expect(existsSync(join(process.cwd(), 'udixio.generated.css'))).toBe(false);
  });

  it('runs onApi before load, and leaves the caller options untouched', async () => {
    const plugin = new TailwindPlugin({});
    const cfg = defineConfig({
      sourceColor: '#6750A4',
      plugins: [new FontPlugin({}), plugin],
    });
    const before = { ...plugin.options };

    const css = await generateStaticThemeCss(cfg, (api) => {
      api.palettes.sync({ primary: () => ({ hue: 120, chroma: 36 }) });
    });

    expect(css).toContain('--color-primary:');
    expect(plugin.options).toEqual(before);
  });
});
