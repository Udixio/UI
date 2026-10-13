import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig, FontPlugin } from '@udixio/theme';
import { TailwindPlugin } from './node/tailwind.plugin';
import { generateStaticThemeCss } from './generate-static-theme-css';
import { buildResolvedCss } from './emit/test-utils';

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

  it('switches Udixio color utilities from light to dark with the system media query', async () => {
    const css = await generateStaticThemeCss(
      defineConfig({
        sourceColor: '#6750A4',
        plugins: [
          new FontPlugin({}),
          new TailwindPlugin({ darkMode: 'media' }),
        ],
      }),
    );
    const resolved = await buildResolvedCss(css, [
      'bg-surface',
      'text-on-surface',
    ]);

    expect(resolved).toMatch(/@media\s*\(prefers-color-scheme:\s*dark\)/);
    expect(resolved).toMatch(
      /@media\s*\(prefers-color-scheme:\s*dark\)[\s\S]*?:root\s*\{[^}]*--udx-on-dark:\s*;/,
    );
    expect(resolved).toMatch(/--udx-light-surface:\s*#[\da-f]{6};/i);
    expect(resolved).toMatch(/--udx-dark-surface:\s*#[\da-f]{6};/i);
    expect(resolved).toContain(
      '--udx-surface-dark-on: var(--udx-on-dark) var(--udx-dark-surface);',
    );
    expect(resolved).toContain(
      '--color-surface: var(--udx-surface-dark-on, var(--udx-light-surface));',
    );
    expect(resolved).toMatch(
      /\.bg-surface\s*\{[^}]*background-color:\s*var\(--color-surface\)/,
    );
    expect(resolved).toMatch(
      /\.text-on-surface\s*\{[^}]*color:\s*var\(--color-on-surface\)/,
    );
  });

  it('never writes to the filesystem, even when outFile is set', async () => {
    const outFile = join(
      __dirname,
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
