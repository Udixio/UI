import { cleanup, render, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ThemeProvider from './ThemeProvider.svelte';
import {
  createUdixioProviderConfig,
  expectedThemeCssColors,
  readThemeCssColors,
  ThemeProviderWorkerMock,
  UDIXIO_THEME_PROVIDER_REFERENCE,
} from '../../../../tailwind/tests/theme-provider-test-utils';

const readGeneratedCss = (): string =>
  [...document.head.querySelectorAll('style')].find((style) =>
    style.textContent?.includes('--udx-light-primary'),
  )?.textContent ?? '';

describe('ThemeProvider (Svelte)', () => {
  beforeEach(() => {
    ThemeProviderWorkerMock.reset();
    vi.stubGlobal('Worker', ThemeProviderWorkerMock);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('matches the pinned Udixio theme output and updates it through the shared worker', async () => {
    const onLoad = vi.fn();
    const { rerender, unmount } = render(ThemeProvider, {
      props: {
        config: createUdixioProviderConfig(
          UDIXIO_THEME_PROVIDER_REFERENCE.cases.purpleLight,
        ),
        throttleDelay: 0,
        onLoad,
      },
    });

    await waitFor(
      () => {
        expect(readThemeCssColors(readGeneratedCss())).toEqual(
          expectedThemeCssColors('purple'),
        );
      },
      { timeout: 5_000 },
    );

    expect(ThemeProviderWorkerMock.instances).toHaveLength(1);
    expect(ThemeProviderWorkerMock.instances[0].messages).toHaveLength(0);
    expect(onLoad).toHaveBeenCalledTimes(1);

    await rerender({
      config: createUdixioProviderConfig(
        UDIXIO_THEME_PROVIDER_REFERENCE.cases.redDark,
      ),
      throttleDelay: 0,
      onLoad,
    });

    await waitFor(
      () => {
        expect(readThemeCssColors(readGeneratedCss())).toEqual(
          expectedThemeCssColors('red'),
        );
      },
      { timeout: 5_000 },
    );

    expect(ThemeProviderWorkerMock.instances[0].messages).toHaveLength(1);
    expect(onLoad).toHaveBeenCalledTimes(2);
    unmount();
    expect(ThemeProviderWorkerMock.instances[0].terminated).toBe(true);
  });
});
