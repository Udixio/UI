import { sourceColorStore } from '@/stores/colorStore.tsx';
import { useStore } from '@nanostores/react';
import { ThemeProvider as Theme } from '@udixio/ui-react';
import config from '../../theme.config';

export const ThemeProvider = () => {
  const $sourceColor = useStore(sourceColorStore);

  return (
    <Theme
      config={{
        ...config,
        sourceColor: $sourceColor,
      }}
    />
  );
};
