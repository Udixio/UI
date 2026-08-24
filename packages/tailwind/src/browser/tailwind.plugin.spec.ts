import { describe, expect, it } from 'vitest';
import { Color, defineConfig, FontPlugin, loader } from '@udixio/theme';
import { TailwindPlugin } from './tailwind.plugin';
import { buildResolvedCss } from '../emit/test-utils';

const primaryDeclaration = (css: string) =>
  css.match(/--color-primary:\s*(#[0-9a-f]{6});/)?.[1];

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
    expect(
      resolved.indexOf(`--color-primary: ${firstPrimary}`),
    ).toBeGreaterThan(resolved.indexOf('--color-primary: #123456'));
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
