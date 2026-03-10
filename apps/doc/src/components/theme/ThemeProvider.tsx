import {
  themeConfigStore,
  themeServiceStore,
} from '@/stores/themeConfigStore.ts';
import { useStore } from '@nanostores/react';
import { ThemeProvider as Theme } from '@udixio/ui-react';

export const ThemeProvider = () => {
  const $themeConfig = useStore(themeConfigStore);

  return (
    <Theme
      throttleDelay={300}
      onLoad={(api) => {
        api.context.darkMode = $themeConfig.isDark ?? false;
        themeServiceStore.set(api);
      }}
      config={$themeConfig}
    />
  );
};
