import { describe, expect, it } from 'vitest';
import { Color, defineConfig, FontPlugin, loader } from '@udixio/theme';
import { TailwindPlugin } from './tailwind.plugin';
import { buildResolvedCss } from '../emit/test-utils';

// The palette is where the hex values live now; `--color-primary` is only the
// mode-resolved alias of `--udx-light-primary` / `--udx-dark-primary`.
const primaryDeclaration = (css: string) =>
  css.match(/--udx-light-primary:\s*(#[0-9a-f]{6});/)?.[1];

describe('browser Tailwind theme generation', () => {
  it('regenerates dynamic primary variables when a reused API changes source', async () => {
    const api = await loader(
      defineConfig({
        sourceColor: '#339900',
        plugins: [new FontPlugin({}), new TailwindPlugin({ ssr: true })],
      }),
      false,
    );

    await api.load();
    const firstCss = api.plugins
      .getPlugin(TailwindPlugin)
      .getInstance().outputCss;
    const firstPrimary = primaryDeclaration(firstCss);

    api.context.update({ sourceColor: '#B3261E' });
    await api.load();
    const secondCss = api.plugins
      .getPlugin(TailwindPlugin)
      .getInstance().outputCss;
    const secondPrimary = primaryDeclaration(secondCss);

    expect(firstPrimary).toBeTruthy();
    expect(secondPrimary).toBeTruthy();
    expect(secondPrimary).not.toBe(firstPrimary);

    const resolved = await buildResolvedCss(
      `@theme { --color-primary: #123456; }\n${firstCss}`,
      ['bg-primary'],
    );
    expect(resolved).toContain(`--udx-light-primary: ${firstPrimary}`);
    expect(resolved).toContain('--color-primary: var(--udx-primary-dark-on, var(--udx-light-primary))');
  });

  it('recomputes primary after removing an override following a source change', async () => {
    const api = await loader(
      defineConfig({
        sourceColor: '#339900',
        plugins: [new FontPlugin({}), new TailwindPlugin({ ssr: true })],
      }),
      false,
    );

    const plugin = api.plugins.getPlugin(TailwindPlugin).getInstance();
    await api.load();
    const sourceGreenCss = plugin.outputCss;

    const blue = Color.fromHex('#3366FF');
    api.palettes.override({
      primary: () => ({ hue: blue.hue, chroma: blue.chroma }),
    });
    await api.load();
    const overriddenBlueCss = plugin.outputCss;

    api.context.update({ sourceColor: '#B3261E' });
    await api.load();
    const overriddenBlueAfterSourceChangeCss = plugin.outputCss;

    api.palettes.sync({});
    await api.load();
    const resetPrimaryCss = plugin.outputCss;

    expect(primaryDeclaration(overriddenBlueCss)).not.toBe(
      primaryDeclaration(sourceGreenCss),
    );
    expect(primaryDeclaration(overriddenBlueAfterSourceChangeCss)).toBe(
      primaryDeclaration(overriddenBlueCss),
    );
    expect(primaryDeclaration(resetPrimaryCss)).not.toBe(
      primaryDeclaration(sourceGreenCss),
    );
    expect(primaryDeclaration(resetPrimaryCss)).not.toBe(
      primaryDeclaration(overriddenBlueCss),
    );
  });
});

describe('light / dark mode toggle', () => {
  const build = async (
    options: ConstructorParameters<typeof TailwindPlugin>[0],
  ) => {
    const api = await loader(
      defineConfig({
        sourceColor: '#339900',
        plugins: [new FontPlugin({}), new TailwindPlugin(options)],
      }),
      false,
    );
    await api.load();
    return api.plugins.getPlugin(TailwindPlugin).getInstance().outputCss;
  };

  const block = (css: string, selector: string) => {
    const start = css.indexOf(`${selector} {`);
    expect(start, `no block for ${selector}`).toBeGreaterThanOrEqual(0);
    return css.slice(start, css.indexOf('}', start));
  };

  it('writes every colour once, as a light/dark palette pair', async () => {
    const css = await build({ ssr: true });
    const light = css.match(/--udx-light-primary:\s*(#[0-9a-f]{6})/g) ?? [];
    const dark = css.match(/--udx-dark-primary:\s*(#[0-9a-f]{6})/g) ?? [];

    expect(light).toHaveLength(1);
    expect(dark).toHaveLength(1);
    expect(light[0]).not.toBe(dark[0]);
    expect(css).not.toMatch(/--color-primary:\s*#/);
  });

  it('switches mode with a one-line toggle instead of a second palette', async () => {
    const css = await build({ ssr: true });

    expect(block(css, '.dark')).toBe('.dark {\n    --udx-on-dark: ;\n  ');
    expect(block(css, '.light')).toBe('.light {\n    --udx-on-dark: initial;\n  ');
  });

  it('re-resolves the aliases at every boundary so nesting is unbounded', async () => {
    const css = await build({ ssr: true, subThemes: { warning: '#ffcc00' } });
    const boundaries = block(css, ':is(.dynamic, .dark, .light, .theme-warning)');

    expect(boundaries).toContain(
      '--udx-primary-dark-on: var(--udx-on-dark) var(--udx-dark-primary);',
    );
    expect(boundaries).toContain(
      '--color-primary: var(--udx-primary-dark-on, var(--udx-light-primary));',
    );
  });

  it('gives a sub-theme its own palette without mode-specific selectors', async () => {
    const css = await build({ ssr: true, subThemes: { warning: '#ffcc00' } });
    const warning = block(
      css,
      ':is(.dynamic.theme-warning, .dynamic .theme-warning, .theme-warning .dynamic)',
    );

    expect(warning).toMatch(/--udx-light-primary:\s*#[0-9a-f]{6}/);
    expect(warning).toMatch(/--udx-dark-primary:\s*#[0-9a-f]{6}/);
    expect(css).not.toContain('.theme-warning.dark');
    expect(css).not.toContain('.theme-warning.light');
  });

  it('drives the root toggle from the media query in media mode', async () => {
    const css = await build({ ssr: true, darkMode: 'media' });

    expect(css).toContain(
      '@media (prefers-color-scheme: dark) {\n    .dynamic {\n      --udx-on-dark: ;',
    );
    expect(block(css, '.light')).toContain('--udx-on-dark: initial;');
  });

  it('honours custom selectors and lets the light one be disabled', async () => {
    const css = await build({
      ssr: true,
      darkSelector: '.night',
      lightSelector: '.day',
    });
    expect(css).toContain('.night {');
    expect(css).toContain('.day {');

    expect(await build({ ssr: true, lightSelector: false })).not.toContain(
      '.light',
    );
  });
});
