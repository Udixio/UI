import { AddColorsOptions } from '../color';

import { PluginAbstract } from '../plugin';
import { Variant } from '../variant/variant';
import { PaletteCallback } from '../palette/palette';

export interface ConfigInterface {
  sourceColor: string;
  contrastLevel?: number;
  isDark?: boolean;
  variant?: Variant;
  colors?: AddColorsOptions;
  palettes?: Record<string, PaletteCallback | string>;
  plugins?: PluginAbstract<any, any>[];
}
