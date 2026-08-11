import { createDefineConfig } from '../config/define-config';
import type { ConfigInterface as ThemeConfig } from '@udixio/theme';
import type { ConfigInterface } from '../config/define-config';
import { TailwindPlugin } from './tailwind.plugin';

export * from '../config/define-config';

export const defineConfig: (config: ConfigInterface) => ThemeConfig =
  createDefineConfig(TailwindPlugin);
