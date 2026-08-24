import {
  Color,
  FontPlugin,
  getVariantByName,
  loader,
  type API,
  type FontPluginOptions,
  type ThemeContextSnapshot,
} from '@udixio/theme';
import { TailwindPlugin, type TailwindPluginOptions } from '@udixio/tailwind';

export interface WorkerInboundMessage {
  id: number;
  snapshot: ThemeContextSnapshot;
  tailwindOptions: TailwindPluginOptions;
  fontOptions: FontPluginOptions;
}

export interface WorkerOutboundMessage {
  id: number;
  css?: string;
  error?: string;
}

/** Stateful processor shared by the real Worker and its integration tests. */
export class ThemeWorkerProcessor {
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
      await this.api.load();

      return this.api.plugins.getPlugin(TailwindPlugin).getInstance().outputCss;
    } catch (error) {
      this.api = null;
      throw error;
    }
  }
}
