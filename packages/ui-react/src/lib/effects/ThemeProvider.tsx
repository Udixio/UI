import {
  type API,
  type ConfigInterface,
  ContextOptions,
  FontPlugin,
  loader,
  serializeThemeContext,
} from '@udixio/theme';
import { useEffect, useRef, useState } from 'react';
import { TailwindPlugin } from '@udixio/tailwind';
import type {
  WorkerInboundMessage,
  WorkerOutboundMessage,
} from './theme.worker';

function isValidHexColor(hexColorString: string) {
  const regex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return regex.test(hexColorString);
}

type ThemeChange = Partial<ContextOptions> & {
  palettes?: ConfigInterface['palettes'];
};

export const ThemeProvider = ({
  config,
  throttleDelay = 100,
  onLoad,
  loadTheme = false,
  initialCss,
}: {
  config: Readonly<ConfigInterface>;
  onLoad?: (api: API) => void;
  throttleDelay?: number;
  loadTheme?: boolean;
  /** Pre-generated CSS from the server (e.g. via `generateThemeCss`).
   *  When provided, the component renders immediately without waiting for the
   *  Worker — eliminates FOUC on SSR pages with dynamic themes. */
  initialCss?: string;
}) => {
  const [themeApi, setThemeApi] = useState<API | null>(null);
  const [outputCss, setOutputCss] = useState<string | null>(initialCss ?? null);

  const workerRef = useRef<Worker | null>(null);
  const generationRef = useRef(0);
  const changeGenerationRef = useRef(0);
  const lastAppliedIdRef = useRef(0);
  const themeApiRef = useRef<API | null>(null);
  const firstLoadDoneRef = useRef(false);
  const previousConfigRef = useRef<Readonly<ConfigInterface> | null>(null);
  const onLoadRef = useRef(onLoad);
  useEffect(() => {
    onLoadRef.current = onLoad;
  }, [onLoad]);

  const loadThemeOnMainThread = async (api: API, changeGeneration: number) => {
    await api.load();
    if (changeGeneration !== changeGenerationRef.current) return;

    const css = api.plugins.getPlugin(TailwindPlugin).getInstance().outputCss;
    setOutputCss(css);
    firstLoadDoneRef.current = true;
    onLoadRef.current?.(api);
  };

  const handleWorkerFailure = () => {
    const api = themeApiRef.current;
    if (!api) return;

    workerRef.current?.terminate();
    workerRef.current = null;
    firstLoadDoneRef.current = false;

    const changeGeneration = ++changeGenerationRef.current;
    void loadThemeOnMainThread(api, changeGeneration);
  };

  // Initialisation de l'API et du Worker
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const api = await loader(config, loadTheme);
      if (cancelled) return;

      themeApiRef.current = api;
      setThemeApi(api);

      const worker = new Worker(new URL('./theme.worker.ts', import.meta.url), {
        type: 'module',
      });
      workerRef.current = worker;

      worker.onmessage = (e: MessageEvent<WorkerOutboundMessage>) => {
        if (e.data.id < generationRef.current) return;
        if (e.data.error) {
          handleWorkerFailure();
          return;
        }
        if (!e.data.css) return;

        if (e.data.id > lastAppliedIdRef.current) {
          lastAppliedIdRef.current = e.data.id;
          firstLoadDoneRef.current = true;
          setOutputCss(e.data.css);
          onLoadRef.current?.(themeApiRef.current!);
        }
      };
      worker.onerror = handleWorkerFailure;
      worker.onmessageerror = handleWorkerFailure;
    })();

    return () => {
      cancelled = true;
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  // Throttle avec exécution en tête (leading) et en fin (trailing)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastExecTimeRef = useRef<number>(0);
  const lastArgsRef = useRef<ThemeChange | null>(null);

  useEffect(() => {
    if (!themeApi) return;

    const previousConfig = previousConfigRef.current;
    const contextArgs: Partial<ContextOptions> = {};

    if (!previousConfig || previousConfig.sourceColor !== config.sourceColor) {
      contextArgs.sourceColor = config.sourceColor;
    }
    if (
      config.contrastLevel !== undefined &&
      (!previousConfig || previousConfig.contrastLevel !== config.contrastLevel)
    ) {
      contextArgs.contrastLevel = config.contrastLevel;
    }
    if (
      config.isDark !== undefined &&
      (!previousConfig || previousConfig.isDark !== config.isDark)
    ) {
      contextArgs.isDark = config.isDark;
    }
    if (
      config.variant !== undefined &&
      (!previousConfig || previousConfig.variant !== config.variant)
    ) {
      contextArgs.variant = config.variant;
    }

    const palettesChanged =
      !previousConfig || previousConfig.palettes !== config.palettes;
    const ctx: ThemeChange = palettesChanged
      ? { ...contextArgs, palettes: config.palettes }
      : contextArgs;

    previousConfigRef.current = config;
    if (Object.keys(ctx).length === 0) return;

    const now = Date.now();
    const timeSinceLast = now - lastExecTimeRef.current;

    const invoke = async (args: ThemeChange) => {
      await applyThemeChange(args);
    };

    if (lastExecTimeRef.current === 0 || timeSinceLast >= throttleDelay) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      const pendingArgs = lastArgsRef.current;
      lastArgsRef.current = null;
      lastExecTimeRef.current = now;
      void invoke(pendingArgs ? { ...pendingArgs, ...ctx } : ctx);
    } else {
      // Plusieurs changements de configuration peuvent arriver pendant le
      // délai : chaque événement ne contient que ses champs modifiés, il faut
      // donc les fusionner pour ne pas perdre un override de palette lorsque
      // le champ source change juste après.
      lastArgsRef.current = {
        ...(lastArgsRef.current ?? {}),
        ...ctx,
      };
      if (!timeoutRef.current) {
        const remaining = Math.max(0, throttleDelay - timeSinceLast);
        timeoutRef.current = setTimeout(async () => {
          timeoutRef.current = null;
          const args = lastArgsRef.current;
          lastArgsRef.current = null;
          if (args) {
            lastExecTimeRef.current = Date.now();
            await invoke(args);
          }
        }, remaining);
      }
    }

    return () => {};
  }, [config, throttleDelay, themeApi]);

  const applyThemeChange = async (ctx: ThemeChange) => {
    if (
      typeof ctx.sourceColor === 'string' &&
      !isValidHexColor(ctx.sourceColor)
    ) {
      throw new Error('Invalid hex color');
    }

    const api = themeApiRef.current;
    if (!api) return;

    const changeGeneration = ++changeGenerationRef.current;

    const { palettes, ...contextArgs } = ctx;

    // Toujours évaluer sur le main thread (rapide)
    api.context.update(contextArgs);
    if ('palettes' in ctx) {
      api.palettes.sync(palettes);
    }

    const worker = workerRef.current;

    // Fallback synchrone : premier rendu ou Worker pas encore prêt
    if (!worker || !firstLoadDoneRef.current) {
      await loadThemeOnMainThread(api, changeGeneration);
      return;
    }

    // Offload au Worker
    const id = ++generationRef.current;
    worker.postMessage({
      id,
      snapshot: serializeThemeContext(api),
      tailwindOptions: api.plugins.getPlugin(TailwindPlugin).toSerializable(),
      fontOptions: api.plugins.getPlugin(FontPlugin).toSerializable(),
    } satisfies WorkerInboundMessage);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  if (!outputCss) {
    return null;
  }

  return <style dangerouslySetInnerHTML={{ __html: outputCss }} />;
};
