import {
  type API,
  type ConfigInterface,
  ContextOptions,
  loader,
} from '@udixio/theme';
import { useEffect, useRef, useState } from 'react';
import { hexFromArgb } from '@material/material-color-utilities';
import { TailwindPlugin } from '@udixio/tailwind';

function isValidHexColor(hexColorString: string) {
  const regex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return regex.test(hexColorString);
}

export const ThemeProvider = ({
  config,
  throttleDelay = 100, // Délai par défaut de 300ms
  onLoad,
  loadTheme = false,
}: {
  config: Readonly<ConfigInterface>;
  onLoad?: (api: API) => void;
  throttleDelay?: number;
  loadTheme?: boolean;
}) => {
  const [themeApi, setThemeApi] = useState<API | null>(null);

  // Charger l'API du thème une fois au montage
  useEffect(() => {
    (async () => {
      const api = await loader(config, loadTheme);
      setThemeApi(api);
    })();
  }, []);

  const [outputCss, setOutputCss] = useState<string | null>(null);

  // Throttle avec exécution en tête (leading) et en fin (trailing)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastExecTimeRef = useRef<number>(0);
  const lastArgsRef = useRef<Partial<ContextOptions> | null>(null);

  useEffect(() => {
    if (!themeApi) return; // Attendre que l'API soit prête

    const ctx: Partial<ContextOptions> = {
      ...config,
      // Assurer la compatibilité avec l'API qui attend sourceColorHex
      sourceColor: config.sourceColor,
    };

    const now = Date.now();
    const timeSinceLast = now - lastExecTimeRef.current;

    const invoke = async (args: Partial<ContextOptions>) => {
      // applique et notifie
      await applyThemeChange(args);
    };

    // Leading: si délai écoulé ou jamais exécuté, exécuter tout de suite
    if (lastExecTimeRef.current === 0 || timeSinceLast >= throttleDelay) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      lastArgsRef.current = null;
      lastExecTimeRef.current = now;
      void invoke(ctx);
    } else {
      // Sinon, mémoriser la dernière requête et programmer une exécution en trailing
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

    // Cleanup: au changement de dépendances, ne rien faire ici (on gère trailing)
    return () => {};
  }, [config, throttleDelay, themeApi]);

  const applyThemeChange = async (ctx: Partial<ContextOptions>) => {
    if (typeof ctx.sourceColor == 'string') {
      if (!isValidHexColor(ctx.sourceColor)) {
        throw new Error('Invalid hex color');
      }
    }

    if (!themeApi) {
      // L'API n'est pas prête; ignorer silencieusement car l'effet principal attend themeApi
      return;
    }
    themeApi.context.update(ctx);

    console.log(themeApi, hexFromArgb(themeApi.context.sourceColor.toInt()));

    await themeApi.load();

    const outputCss = themeApi?.plugins
      .getPlugin(TailwindPlugin)
      .getInstance().outputCss;
    setOutputCss(outputCss);
    console.log(outputCss);

    onLoad?.(themeApi);
  };

  // Cleanup lors du démontage du composant
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
