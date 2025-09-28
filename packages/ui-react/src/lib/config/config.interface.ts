import {
  ConfigInterface as ConfigTheme,
  FontPluginOptions,
} from '@udixio/theme';
import { TailwindPluginOptions } from '@udixio/tailwind';

export type ConfigInterface = Omit<ConfigTheme, 'plugins' | 'isDark'> &
  TailwindPluginOptions &
  FontPluginOptions;
