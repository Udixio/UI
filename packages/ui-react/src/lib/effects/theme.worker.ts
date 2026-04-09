import {
  loader,
  getVariantByName,
  Hct,
  FontPlugin,
  serializeThemeContext,
} from '@udixio/theme';
import type { FontPluginOptions, ThemeContextSnapshot } from '@udixio/theme';
import { TailwindPlugin } from '@udixio/tailwind';
import type { TailwindPluginOptions } from '@udixio/tailwind';

export interface WorkerInboundMessage {
  id: number;
  snapshot: ThemeContextSnapshot;
  tailwindOptions: TailwindPluginOptions;
  fontOptions: FontPluginOptions;
}

export interface WorkerOutboundMessage {
  id: number;
  css: string;
}

// Re-export for use in ThemeProvider (type-only, stripped from bundle)
export type { ThemeContextSnapshot, serializeThemeContext };

self.onmessage = async (event: MessageEvent<WorkerInboundMessage>) => {
  const { id, snapshot, tailwindOptions, fontOptions } = event.data;

  const api = await loader(
    {
      sourceColor: Hct.from(
        snapshot.sourceColor.hue,
        snapshot.sourceColor.chroma,
        snapshot.sourceColor.tone,
      ),
      isDark: snapshot.isDark,
      contrastLevel: snapshot.contrastLevel,
      variant: getVariantByName(snapshot.variantName),
      plugins: [new FontPlugin(fontOptions), new TailwindPlugin(tailwindOptions)],
    },
    false,
  );

  // sync() utilise override() — évite addFromCustomPalette dupliqué sur les palettes variant
  const palettesCallbacks = Object.fromEntries(
    Object.entries(snapshot.palettes).map(([key, { hue, chroma }]) => [
      key,
      () => ({ hue, chroma }),
    ]),
  );
  api.palettes.sync(palettesCallbacks);

  await api.load();

  const css = api.plugins.getPlugin(TailwindPlugin).getInstance().outputCss;

  self.postMessage({ id, css } satisfies WorkerOutboundMessage);
};
