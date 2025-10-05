import { ConfigInterface } from './config.interface';
import {
  ConfigInterface as ConfigTheme,
  defineConfig as defineConfigTheme,
  FontPlugin,
  Variants,
} from '@udixio/theme';
import { TailwindPlugin } from '@udixio/tailwind';

export function defineConfig(configObject: ConfigInterface): ConfigTheme {
  return defineConfigTheme({
    variant: Variants.Fidelity,
    ...configObject,
    plugins: [new FontPlugin(configObject), new TailwindPlugin(configObject)],
  });
}
