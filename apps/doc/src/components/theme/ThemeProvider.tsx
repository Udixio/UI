import { themeConfigStore } from '@/stores/themeConfigStore.ts';
import { useStore } from '@nanostores/react';
import { ThemeProvider as Theme } from '@udixio/ui-react';

export const ThemeProvider = () => {
  const $themeConfig = useStore(themeConfigStore);

  return (
    <Theme
      config={{
        ...$themeConfig,
      }}
    />
  );
};
