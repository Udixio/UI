import { type ConfigInterface, loader } from '@udixio/theme';
import { useEffect, useState } from 'react';
import { TailwindPlugin } from '@udixio/tailwind';

function isValidHexColor(hexColorString: string) {
  const regex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return regex.test(hexColorString);
}

export const ThemeProvider = ({ config }: { config: ConfigInterface }) => {
  const [error, setError] = useState<string | null>(null);

  const [outputCss, setOutputCss] = useState<null | string>(null);

  useEffect(() => {
    if (!isValidHexColor(config.sourceColor)) {
      setError('Invalid hex color');
      return;
    }

    const initTheme = async () => {
      try {
        const api = await loader(config);

        api.themes.update({
          sourceColorHex: config.sourceColor,
        });

        await api.load();

        setOutputCss(
          api.plugins.getPlugin(TailwindPlugin).getInstance().outputCss,
        );

        console.log('Theme loaded');
      } catch (err) {
        console.error('Theme loading failed:', err);
        setError(err instanceof Error ? err.message : 'Theme loading failed');
      }
    };

    initTheme();
  }, [config.sourceColor]);
  if (error) {
    console.error('ThemeProvider error:', error);
    return null;
  }

  if (!outputCss) {
    return null;
  }
  return (
    <style
      type="text/tailwindcss"
      dangerouslySetInnerHTML={{ __html: outputCss }}
    />
  );
};
