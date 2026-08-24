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
  ThemeWorkerProcessor,
  type WorkerInboundMessage,
  type WorkerOutboundMessage,
} from '../lib/effects/theme.worker.processor';

const primaryDeclaration = (css: string) =>
  css.match(/--color-primary:\s*(#[0-9a-f]{6});/)?.[1];

class ThemeWorkerMock {
  onmessage: ((event: MessageEvent<WorkerOutboundMessage>) => void) | null =
    null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  onmessageerror: ((event: MessageEvent) => void) | null = null;

  private readonly processor = new ThemeWorkerProcessor();
  private terminated = false;

  postMessage(message: WorkerInboundMessage) {
    void this.processor.process(message).then(
      (css) => {
        if (this.terminated) return;
        this.onmessage?.({
          data: { id: message.id, css },
        } as MessageEvent<WorkerOutboundMessage>);
      },
      (error) => {
        if (this.terminated) return;
        this.onerror?.(
          new ErrorEvent('error', {
            error,
            message: error instanceof Error ? error.message : String(error),
          }),
        );
      },
    );
  }

  terminate() {
    this.terminated = true;
  }
}

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
    vi.stubGlobal('Worker', ThemeWorkerMock);
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
});
