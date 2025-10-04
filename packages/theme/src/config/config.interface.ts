import { AddColorsOptions } from '../color';

import { PluginAbstract } from '../plugin';
import { Variant } from '../variant/variant';

export interface ConfigInterface {
  sourceColor: string;
  contrastLevel?: number;
  isDark?: boolean;
  variant?: Variant;
  colors?: AddColorsOptions;
  palettes?: Record<string, string>;
  plugins?: PluginAbstract<any, any>[];
}
