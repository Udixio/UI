import {
  themeConfigStore,
  themeServiceStore,
} from '@/stores/themeConfigStore.ts';
import { useStore } from '@nanostores/react';
import { ThemeProvider as Theme } from '@udixio/ui-react';
import { useRef } from 'react';

export const ThemeProvider = () => {
  const $themeConfig = useStore(themeConfigStore);
  const renders = useRef(0);
  renders.current++;
  console.log('ThemeProvider render count:', renders.current);

  // const $themeConfig = useStore(themeConfigStore);

  return (
    <Theme
      onLoad={(api) => {
        themeServiceStore.set(api);
      }}
      config={$themeConfig}
    />
  );
};
