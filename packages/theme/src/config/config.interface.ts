import { AddColorsOptions } from '../color';
import { Hct } from '../material-color-utilities/htc';
import { PluginAbstract } from '../plugin';
import { Variant } from '../variant/variant';
import { PaletteCallback } from '../palette/palette';
import { Context } from '../context';

export interface ConfigInterface {
  sourceColor: string | Hct | ((context: Context) => string | Hct);
  contrastLevel?: number;
  isDark?: boolean;
  variant?: Variant;
  colors?: AddColorsOptions;
  palettes?: Record<string, PaletteCallback | string>;
  plugins?: PluginAbstract<any, any>[];
}
