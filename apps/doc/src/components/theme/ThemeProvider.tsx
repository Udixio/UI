import {
  themeConfigStore,
  themeServiceStore,
} from '@/stores/themeConfigStore.ts';
import { useStore } from '@nanostores/react';
import { ThemeProvider as Theme } from '@udixio/ui-react';
import { useRef } from 'react';

export const ThemeProvider = () => {
  const $themeConfig = useStore(themeConfigStore);
  const lastLoadRef = useRef<number>(0);

  return (
    <Theme
      onLoad={(api) => {
        const now = performance.now();
        const elapsed = lastLoadRef.current ? now - lastLoadRef.current : 0;
        lastLoadRef.current = now;
        api.context.darkMode = $themeConfig.isDark ?? false;
        themeServiceStore.set(api);
      }}
      config={$themeConfig}
    />
  );
};
