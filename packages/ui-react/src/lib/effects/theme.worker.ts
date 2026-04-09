import {
  loader,
  getVariantByName,
  Hct,
  FontPlugin,
} from '@udixio/theme';
import type { API, FontPluginOptions, ThemeContextSnapshot } from '@udixio/theme';
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

let workerApi: API | null = null;
let latestMessage: WorkerInboundMessage | null = null;
let processing = false;

async function processLatest() {
  if (processing || !latestMessage) return;
  processing = true;

  const msg = latestMessage;
  latestMessage = null;

  const { snapshot, tailwindOptions, fontOptions } = msg;

  const palettesCallbacks = Object.fromEntries(
    Object.entries(snapshot.palettes).map(([key, { hue, chroma }]) => [
      key,
      () => ({ hue, chroma }),
    ]),
  );

  try {
    if (!workerApi) {
      // Initialisation unique — coût amorti sur tous les messages suivants
      workerApi = await loader(
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
      workerApi.palettes.sync(palettesCallbacks);
    } else {
      // Mise à jour légère — pas de re-bootstrap
      workerApi.context.update({
        isDark: snapshot.isDark,
        contrastLevel: snapshot.contrastLevel,
        sourceColor: Hct.from(
          snapshot.sourceColor.hue,
          snapshot.sourceColor.chroma,
          snapshot.sourceColor.tone,
        ),
        variant: getVariantByName(snapshot.variantName),
      });
      workerApi.palettes.sync(palettesCallbacks);

      // Mise à jour des options plugins si elles ont changé
      workerApi.plugins.getPlugin(TailwindPlugin).options = tailwindOptions;
      workerApi.plugins.getPlugin(FontPlugin).options = fontOptions;
    }

    await workerApi.load();

    const css = workerApi.plugins.getPlugin(TailwindPlugin).getInstance().outputCss;
    self.postMessage({ id: msg.id, css } satisfies WorkerOutboundMessage);
  } catch (e) {
    console.error('[Worker] error during processLatest:', e);
    workerApi = null; // reset state for clean retry
  } finally {
    processing = false;
    // Traite le prochain message s'il est arrivé pendant le traitement
    processLatest();
  }
}

self.onmessage = (event: MessageEvent<WorkerInboundMessage>) => {
  latestMessage = event.data;
  processLatest();
};
