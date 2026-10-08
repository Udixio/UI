import {
  Color,
  FontPlugin,
  getVariantByName,
  loader,
  serializeThemeContext,
  type API,
} from '@udixio/theme';
import { TailwindPlugin } from './browser/tailwind.plugin';
import type {
  DynamicThemeWorkerInboundMessage,
  DynamicThemeWorkerOutboundMessage,
  DynamicThemeWorkerScope,
} from './dynamic-theme-runtime';

export type WorkerInboundMessage = DynamicThemeWorkerInboundMessage;
export type WorkerOutboundMessage = DynamicThemeWorkerOutboundMessage;

/** Serializes the current API into the common worker protocol. */
export function createDynamicThemeWorkerMessage(
  id: number,
  api: API,
): DynamicThemeWorkerInboundMessage {
  return {
    id,
    snapshot: serializeThemeContext(api),
    tailwindOptions: api.plugins.getPlugin(TailwindPlugin).toSerializable(),
    fontOptions: api.plugins.getPlugin(FontPlugin).toSerializable(),
  };
}

/** Rebuilds dynamic theme CSS from the framework-neutral worker protocol. */
export class DynamicThemeWorkerProcessor {
  private api: API | null = null;

  async process({
    snapshot,
    tailwindOptions,
    fontOptions,
  }: WorkerInboundMessage): Promise<string> {
    const palettesCallbacks = Object.fromEntries(
      Object.entries(snapshot.palettes).map(([key, { hue, chroma }]) => [
        key,
        () => ({ hue, chroma }),
      ]),
    );

    try {
      if (!this.api) {
        this.api = await loader(
          {
            sourceColor: Color.from(snapshot.sourceColor),
            isDark: snapshot.isDark,
            contrastLevel: snapshot.contrastLevel,
            variant: getVariantByName(snapshot.variantName),
            plugins: [
              new FontPlugin(fontOptions),
              new TailwindPlugin({ ...tailwindOptions, ssr: true }),
            ],
          },
          false,
        );
      } else {
        this.api.context.update({
          isDark: snapshot.isDark,
          contrastLevel: snapshot.contrastLevel,
          sourceColor: Color.from(snapshot.sourceColor),
          variant: getVariantByName(snapshot.variantName),
        });

        this.api.plugins.getPlugin(TailwindPlugin).options = {
          ...tailwindOptions,
          ssr: true,
        };
        this.api.plugins.getPlugin(FontPlugin).options = fontOptions;
      }

      this.api.palettes.sync(palettesCallbacks);
      const colorKeys = Object.keys(snapshot.colors ?? {});
      this.api.colors.syncConfiguredColors(
        colorKeys.length
          ? Object.fromEntries(
              colorKeys.map((key) => [key, Color.from(snapshot.colors[key])]),
            )
          : undefined,
      );
      await this.api.load();

      return this.api.plugins.getPlugin(TailwindPlugin).getInstance().outputCss;
    } catch (error) {
      this.api = null;
      throw error;
    }
  }
}

/** Installs the shared request queue and response protocol on a worker scope. */
export function installDynamicThemeWorker(
  scope: DynamicThemeWorkerScope,
): void {
  const processor = new DynamicThemeWorkerProcessor();
  let latestMessage: WorkerInboundMessage | null = null;
  let processing = false;

  async function processLatest(): Promise<void> {
    if (processing || !latestMessage) return;
    processing = true;

    const message = latestMessage;
    latestMessage = null;

    try {
      const css = await processor.process(message);
      scope.postMessage({ id: message.id, css });
    } catch (error) {
      console.error('[Theme worker] Failed to generate CSS:', error);
      scope.postMessage({
        id: message.id,
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      processing = false;
      void processLatest();
    }
  }

  scope.onmessage = (event) => {
    latestMessage = event.data;
    void processLatest();
  };
}
