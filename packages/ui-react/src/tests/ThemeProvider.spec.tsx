import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  Color,
  FontPlugin,
  Variants,
  type ConfigInterface,
} from '@udixio/theme';
import { TailwindPlugin } from '@udixio/tailwind';
import { ThemeProvider } from '../lib/effects/ThemeProvider';
import {
  createUdixioProviderConfig,
  expectedThemeCssColors,
  readThemeCssColors,
  ThemeProviderWorkerMock,
  UDIXIO_THEME_PROVIDER_REFERENCE,
} from '../../../tailwind/tests/theme-provider-test-utils';

// The hex values live in the light/dark palette; `--color-primary` is the
// mode-resolved alias.
const primaryDeclaration = (css: string) =>
  css.match(/--udx-light-primary:\s*(#[0-9a-f]{6});/)?.[1];

const createConfig = (sourceColor: string): ConfigInterface => ({
  sourceColor,
  variant: Variants.Udixio,
  plugins: [
    new FontPlugin({}),
    new TailwindPlugin({ ssr: true, dynamicSelector: '.dynamic' }),
  ],
});

describe('ThemeProvider', () => {
  beforeEach(() => {
    ThemeProviderWorkerMock.reset();
    vi.stubGlobal('Worker', ThemeProviderWorkerMock);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('applies each palette interaction without waiting for the next one', async () => {
    const baseConfig = createConfig('#339900');
    const { container, rerender } = render(
      <ThemeProvider config={baseConfig} throttleDelay={0} />,
    );

    const readPrimary = () =>
      primaryDeclaration(container.querySelector('style')?.textContent ?? '');

    await waitFor(() => expect(readPrimary()).toBeTruthy());
    const sourceGreenPrimary = readPrimary();

    const blue = Color.fromHex('#3366FF');
    const primaryOverride = () => ({ hue: blue.hue, chroma: blue.chroma });
    rerender(
      <ThemeProvider
        config={{ ...baseConfig, palettes: { primary: primaryOverride } }}
        throttleDelay={0}
      />,
    );

    await waitFor(() => expect(readPrimary()).not.toBe(sourceGreenPrimary));
    const overriddenBluePrimary = readPrimary();

    rerender(
      <ThemeProvider
        config={{
          ...baseConfig,
          sourceColor: '#B3261E',
          palettes: { primary: primaryOverride },
        }}
        throttleDelay={0}
      />,
    );

    await waitFor(() => expect(readPrimary()).toBe(overriddenBluePrimary));

    rerender(
      <ThemeProvider
        config={{ ...baseConfig, sourceColor: '#B3261E', palettes: {} }}
        throttleDelay={0}
      />,
    );

    await waitFor(() => {
      expect(readPrimary()).not.toBe(overriddenBluePrimary);
      expect(readPrimary()).not.toBe(sourceGreenPrimary);
    });
  });

  it('matches the pinned Udixio theme output before and after a runtime update', async () => {
    const initialState = UDIXIO_THEME_PROVIDER_REFERENCE.cases.purpleLight;
    const updatedState = UDIXIO_THEME_PROVIDER_REFERENCE.cases.redDark;
    const initialConfig = createUdixioProviderConfig(initialState);
    const onLoad = vi.fn();
    const { container, rerender, unmount } = render(
      <ThemeProvider
        config={initialConfig}
        throttleDelay={0}
        onLoad={onLoad}
      />,
    );

    await waitFor(() => {
      const css = container.querySelector('style')?.textContent ?? '';
      expect(readThemeCssColors(css)).toEqual(expectedThemeCssColors('purple'));
    });

    expect(initialConfig.variant?.name).toBe(
      UDIXIO_THEME_PROVIDER_REFERENCE.variant,
    );
    expect(ThemeProviderWorkerMock.instances).toHaveLength(1);
    expect(ThemeProviderWorkerMock.instances[0].messages).toHaveLength(0);

    rerender(
      <ThemeProvider
        config={createUdixioProviderConfig(updatedState)}
        throttleDelay={0}
        onLoad={onLoad}
      />,
    );

    await waitFor(() => {
      const css = container.querySelector('style')?.textContent ?? '';
      expect(readThemeCssColors(css)).toEqual(expectedThemeCssColors('red'));
    });

    expect(ThemeProviderWorkerMock.instances[0].messages).toHaveLength(1);
    expect(onLoad).toHaveBeenCalledTimes(2);
    unmount();
    expect(ThemeProviderWorkerMock.instances[0].terminated).toBe(true);
  });
});
