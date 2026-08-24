import {
  themeConfigStore,
  themeServiceStore,
  themeServiceVersionStore,
} from '@/stores/themeConfigStore.ts';
import { useStore } from '@nanostores/react';
import { ThemeProvider as Theme } from '@udixio/ui-react';

export const ThemeProvider = () => {
  const $themeConfig = useStore(themeConfigStore);

  return (
    <Theme
      onLoad={(api) => {
        api.context.darkMode = themeConfigStore.get().isDark ?? false;
        if (themeServiceStore.get() !== api) {
          themeServiceStore.set(api);
        }
        themeServiceVersionStore.set(themeServiceVersionStore.get() + 1);
      }}
      config={$themeConfig}
    />
  );
};
