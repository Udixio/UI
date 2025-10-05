import {
  type API,
  type ConfigInterface,
  ContextOptions,
  loader,
} from '@udixio/theme';
import { useEffect, useRef, useState } from 'react';
import { TailwindPlugin } from '@udixio/tailwind';

function isValidHexColor(hexColorString: string) {
  const regex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return regex.test(hexColorString);
}

export const ThemeProvider = ({
  config,
  throttleDelay = 100, // Délai par défaut de 300ms
  onLoad,
}: {
  config: Readonly<ConfigInterface>;
  onLoad?: (api: API) => void;
  throttleDelay?: number;
}) => {
  const [themeApi, setThemeApi] = useState<API | null>(null);

  useEffect(() => {
    (async () => {
      const api = await loader(config);
      setThemeApi(api);
    })();
  }, []);

  const outputCss = themeApi?.plugins
    .getPlugin(TailwindPlugin)
    .getInstance().outputCss;

  // Refs pour gérer le throttling
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef<boolean>(true);

  useEffect(() => {
    // Si c'est le premier chargement, on applique immédiatement
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      applyThemeChange(config);
      return;
    }

    // Annuler le timeout précédent s'il existe
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Programmer un nouveau changement de thème avec un délai
    timeoutRef.current = setTimeout(async () => {
      await applyThemeChange({
        ...config,
        sourceColorHex: config.sourceColor,
      });
      timeoutRef.current = null;
    }, throttleDelay);

    // Cleanup function pour annuler le timeout si le composant se démonte
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [config, throttleDelay]);

  const applyThemeChange = async (ctx: Partial<ContextOptions>) => {
    if (ctx.sourceColorHex && !isValidHexColor(ctx.sourceColorHex)) {
      throw new Error('Invalid hex color');
    }

    if (!themeApi) {
      throw new Error('Theme API is not initialized');
    }
    themeApi.context.update(ctx);
    await themeApi.load();
    onLoad?.(themeApi);
  };

  // Cleanup lors du démontage du composant
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!outputCss) {
    return null;
  }

  return <style dangerouslySetInnerHTML={{ __html: outputCss }} />;
};
