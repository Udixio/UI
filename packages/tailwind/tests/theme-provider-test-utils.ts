import type {
  DynamicThemeWorker,
  DynamicThemeWorkerInboundMessage,
  DynamicThemeWorkerOutboundMessage,
} from '../src/dynamic-theme-runtime';
import { DynamicThemeWorkerProcessor } from '../src/dynamic-theme-worker.processor';
import { defineConfig } from '@udixio/tailwind';
import { UDIXIO_THEME_PROVIDER_REFERENCE } from './fixtures/udixio-theme-provider-reference';

export { UDIXIO_THEME_PROVIDER_REFERENCE };

type ReferenceSeed = 'purple' | 'red';
type ReferenceMode = 'light' | 'dark';

function toCssColorName(name: string): string {
  return name.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
}

export function expectedThemeCssColors(
  seed: ReferenceSeed,
): Record<string, string> {
  const declarations: Record<string, string> = {};

  const modes: readonly ReferenceMode[] = ['light', 'dark'];
  for (const mode of modes) {
    const referenceCase =
      seed === 'purple'
        ? mode === 'light'
          ? UDIXIO_THEME_PROVIDER_REFERENCE.cases.purpleLight
          : UDIXIO_THEME_PROVIDER_REFERENCE.cases.purpleDark
        : mode === 'light'
          ? UDIXIO_THEME_PROVIDER_REFERENCE.cases.redLight
          : UDIXIO_THEME_PROVIDER_REFERENCE.cases.redDark;

    for (const [name, color] of Object.entries(referenceCase.colors)) {
      declarations[`--udx-${mode}-${toCssColorName(name)}`] = color;
    }
  }

  return declarations;
}

export function readThemeCssColors(css: string): Record<string, string> {
  return Object.fromEntries(
    [
      ...css.matchAll(/(--udx-(?:light|dark)-[a-z0-9-]+):\s*(#[a-f0-9]{6});/g),
    ].map(([, name, value]) => [name, value]),
  );
}

export async function waitForThemeCss(
  readCss: () => string,
  expected: Record<string, string>,
  timeout = 5_000,
): Promise<string> {
  const start = Date.now();
  let actual: Record<string, string> = {};

  while (Date.now() - start < timeout) {
    actual = readThemeCssColors(readCss());
    if (
      Object.keys(actual).length === Object.keys(expected).length &&
      Object.entries(expected).every(([key, value]) => actual[key] === value)
    ) {
      return readCss();
    }

    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  throw new Error(
    `Timed out waiting for theme CSS.\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`,
  );
}

export function createUdixioProviderConfig(state: {
  sourceColor: string;
  isDark: boolean;
}) {
  const config = defineConfig({
    sourceColor: state.sourceColor,
    contrastLevel: UDIXIO_THEME_PROVIDER_REFERENCE.contrastLevel,
    dynamicSelector: '.dynamic',
    ssr: true,
  });

  return { ...config, isDark: state.isDark };
}

/** Browser Worker double that runs the actual shared worker processor. */
export class ThemeProviderWorkerMock implements DynamicThemeWorker {
  static readonly instances: ThemeProviderWorkerMock[] = [];

  onmessage:
    ((event: MessageEvent<DynamicThemeWorkerOutboundMessage>) => void) | null =
    null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  onmessageerror: ((event: MessageEvent) => void) | null = null;

  readonly messages: DynamicThemeWorkerInboundMessage[] = [];
  private readonly processor = new DynamicThemeWorkerProcessor();
  terminated = false;

  constructor() {
    ThemeProviderWorkerMock.instances.push(this);
  }

  postMessage(message: DynamicThemeWorkerInboundMessage): void {
    this.messages.push(message);

    void this.processor.process(message).then(
      (css) => {
        if (this.terminated) return;
        this.onmessage?.({
          data: { id: message.id, css },
        } as MessageEvent<DynamicThemeWorkerOutboundMessage>);
      },
      (error: unknown) => {
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

  terminate(): void {
    this.terminated = true;
  }

  static reset(): void {
    this.instances.length = 0;
  }
}
