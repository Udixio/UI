import { AddColorsOptions } from '../color';
import { Color } from '../color/color';
import { PluginAbstract } from '../plugin';
import { Variant } from '../variant/variant';
import { PaletteCallback } from '../palette/palette';
import { Context } from '../context';

export interface ConfigInterface {
  sourceColor: string | Color | ((context: Context) => string | Color);
  contrastLevel?: number;
  isDark?: boolean;
  variant?: Variant;
  colors?: AddColorsOptions;
  palettes?: Record<string, PaletteCallback | string>;
  plugins?: PluginAbstract<any, any>[];
}
