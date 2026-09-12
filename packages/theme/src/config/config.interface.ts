import type { ColorInput, ColorsConfig } from '../color/color.types';
import type { PluginAbstract } from '../plugin';
import type { Variant } from '../variant/variant';
import type { PaletteOptions } from '../palette/palette.api';
import type { Context } from '../context';

/**
 * The theme's source color, resolved directly or from the context.
 *
 * A hex string is the short form meant for configuration. It is normalized
 * to a `Color` as soon as it enters the engine.
 */
export type SourceColor = ColorInput | ((context: Context) => ColorInput);

export type { ColorConfigRecord, ColorsConfig } from '../color/color.types';

export interface ConfigInterface {
  sourceColor: SourceColor;
  contrastLevel?: number;
  isDark?: boolean;
  variant?: Variant;
  colors?: ColorsConfig;
  palettes?: PaletteOptions;
  plugins?: PluginAbstract<any, any>[];
}
