import { AddColorsOptions } from '../color';
import { Variant } from '../theme';
import { PluginAbstract } from '../plugin';

export interface ConfigInterface {
  sourceColor: string;
  contrastLevel?: number;
  isDark?: boolean;
  variant?: Variant;
  colors?: AddColorsOptions;
  useDefaultColors?: boolean;
  palettes?: Record<string, string>;
  plugins?: PluginAbstract<any, any>[];
}
