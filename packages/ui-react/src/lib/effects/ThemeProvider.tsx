import { type API, type ConfigInterface, loader } from '@udixio/theme';
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
  config: ConfigInterface;
  onLoad?: (api: API) => void;
  throttleDelay?: number;
}) => {
  const [error, setError] = useState<string | null>(null);
  const [outputCss, setOutputCss] = useState<null | string>(null);

  // Refs pour gérer le throttling
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSourceColorRef = useRef<string>(config.sourceColor);
  const isInitialLoadRef = useRef<boolean>(true);

  useEffect(() => {
    // Si c'est le premier chargement, on applique immédiatement
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      lastSourceColorRef.current = config.sourceColor;
      applyThemeChange(config.sourceColor);
      return;
    }

    // Si la couleur n'a pas changé, on ne fait rien
    if (config.sourceColor === lastSourceColorRef.current) {
      return;
    }

    // Annuler le timeout précédent s'il existe
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Programmer un nouveau changement de thème avec un délai
    timeoutRef.current = setTimeout(async () => {
      lastSourceColorRef.current = config.sourceColor;
      await applyThemeChange(config.sourceColor);
      timeoutRef.current = null;
    }, throttleDelay);

    // Cleanup function pour annuler le timeout si le composant se démonte
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [config.sourceColor, throttleDelay]);

  const applyThemeChange = async (sourceColor: string) => {
    if (!isValidHexColor(sourceColor)) {
      setError('Invalid hex color');
      return;
    }

    setError(null);

    try {
      // Mesure du temps de chargement de l'API
      const api = await loader({
        ...config,
        sourceColor,
      });
      onLoad?.(api);

      const generatedCss = api.plugins
        .getPlugin(TailwindPlugin)
        .getInstance().outputCss;

      if (generatedCss) {
        setOutputCss(generatedCss);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Theme loading failed');
    }
  };

  // Cleanup lors du démontage du composant
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (error) {
    return null;
  }

  if (!outputCss) {
    console.error('ThemeProvider null');
    return null;
  }

  return <style dangerouslySetInnerHTML={{ __html: outputCss }} />;
};
