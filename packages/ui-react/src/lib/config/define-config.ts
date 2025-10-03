import { ConfigInterface } from './config.interface';
import {
  ConfigInterface as ConfigTheme,
  FontPlugin,
  Variants,
} from '@udixio/theme';
import { TailwindPlugin } from '@udixio/tailwind';

export function defineConfig(configObject: ConfigInterface): ConfigTheme {
  if (!configObject || typeof configObject !== 'object') {
    throw new Error('The configuration is missing or not an object');
  }
  if (!('sourceColor' in configObject)) {
    throw new Error('Invalid configuration');
  }

  return {
    variant: Variants.Fidelity,
    ...configObject,
    plugins: [new FontPlugin(configObject), new TailwindPlugin(configObject)],
  };
}
