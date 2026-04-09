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

export const ThemeProvider = ({
  config,
  throttleDelay = 100,
  onLoad,
  loadTheme = false,
}: {
  config: Readonly<ConfigInterface>;
  onLoad?: (api: API) => void;
  throttleDelay?: number;
  loadTheme?: boolean;
}) => {
  const [themeApi, setThemeApi] = useState<API | null>(null);
  const [outputCss, setOutputCss] = useState<string | null>(null);

  const workerRef = useRef<Worker | null>(null);
  const generationRef = useRef(0);
  const lastAppliedIdRef = useRef(0);
  const themeApiRef = useRef<API | null>(null);
  const firstLoadDoneRef = useRef(false);
  const onLoadRef = useRef(onLoad);
  useEffect(() => {
    onLoadRef.current = onLoad;
  }, [onLoad]);

  // Initialisation de l'API et du Worker
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const api = await loader(config, loadTheme);
      if (cancelled) return;

      themeApiRef.current = api;
      setThemeApi(api);

      const worker = new Worker(
        new URL('./theme.worker.ts', import.meta.url),
        { type: 'module' },
      );
      workerRef.current = worker;

      worker.onmessage = (e: MessageEvent<WorkerOutboundMessage>) => {
        if (e.data.id > lastAppliedIdRef.current) {
          lastAppliedIdRef.current = e.data.id;
          firstLoadDoneRef.current = true;
          setOutputCss(e.data.css);
          onLoadRef.current?.(themeApiRef.current!);
        }
      };
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
  const lastArgsRef = useRef<Partial<ContextOptions> | null>(null);

  useEffect(() => {
    if (!themeApi) return;

    const ctx: Partial<ContextOptions> = {
      ...config,
      sourceColor: config.sourceColor,
    };

    const now = Date.now();
    const timeSinceLast = now - lastExecTimeRef.current;

    const invoke = async (args: Partial<ContextOptions>) => {
      await applyThemeChange(args);
    };

    if (lastExecTimeRef.current === 0 || timeSinceLast >= throttleDelay) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      lastArgsRef.current = null;
      lastExecTimeRef.current = now;
      void invoke(ctx);
    } else {
      lastArgsRef.current = ctx;
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

  const applyThemeChange = async (ctx: Partial<ContextOptions>) => {
    if (typeof ctx.sourceColor === 'string' && !isValidHexColor(ctx.sourceColor)) {
      throw new Error('Invalid hex color');
    }

    const api = themeApiRef.current;
    if (!api) return;

    // Toujours évaluer sur le main thread (rapide)
    api.context.update(ctx);
    api.palettes.sync((ctx as any).palettes);

    const worker = workerRef.current;

    // Fallback synchrone : premier rendu ou Worker pas encore prêt
    if (!worker || !firstLoadDoneRef.current) {
      await api.load();
      const css = api.plugins.getPlugin(TailwindPlugin).getInstance().outputCss;
      setOutputCss(css);
      firstLoadDoneRef.current = true;
      onLoad?.(api);
      return;
    }

    // Offload au Worker
    const id = ++generationRef.current;
    worker.postMessage({
      id,
      snapshot: serializeThemeContext(api),
      tailwindOptions: api.plugins.getPlugin(TailwindPlugin).options,
      fontOptions: api.plugins.getPlugin(FontPlugin).options,
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
