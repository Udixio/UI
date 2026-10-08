import {
  createDynamicThemeWorker,
  createDynamicThemeWorkerMessage,
  DynamicThemeRuntime,
  TailwindPlugin,
  type DynamicThemeWorker,
} from '@udixio/tailwind';
import type { API, ConfigInterface } from '@udixio/theme';
import { useEffect, useRef, useState } from 'react';
import ReactThemeWorkerConstructor from './theme.worker.ts?worker';

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
  const [outputCss, setOutputCss] = useState<string | null>(initialCss ?? null);

  const runtimeRef = useRef<DynamicThemeRuntime | null>(null);
  const initialConfigRef = useRef(config);
  const initialLoadThemeRef = useRef(loadTheme);
  const onLoadRef = useRef(onLoad);

  useEffect(() => {
    onLoadRef.current = onLoad;
  }, [onLoad]);

  useEffect(() => {
    const runtime = new DynamicThemeRuntime({
      config: initialConfigRef.current,
      loadTheme: initialLoadThemeRef.current,
      createWorker: () =>
        createDynamicThemeWorker() ??
        (new ReactThemeWorkerConstructor() as unknown as DynamicThemeWorker),
      getCss: (api) =>
        api.plugins.getPlugin(TailwindPlugin).getInstance().outputCss,
      createWorkerMessage: createDynamicThemeWorkerMessage,
      onCss: setOutputCss,
      onLoad: (api) => onLoadRef.current?.(api),
    });
    runtimeRef.current = runtime;
    runtime.start();

    return () => {
      runtime.destroy();
      runtimeRef.current = null;
    };
  }, []);

  useEffect(() => {
    runtimeRef.current?.update(config, throttleDelay);
  }, [config, throttleDelay]);

  if (!outputCss) {
    return null;
  }

  return <style dangerouslySetInnerHTML={{ __html: outputCss }} />;
};
