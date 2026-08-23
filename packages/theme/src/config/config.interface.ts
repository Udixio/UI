import type { ColorInput, ColorsConfig } from '../color/color.types';
import type { PluginAbstract } from '../plugin';
import type { Variant } from '../variant/variant';
import type { PaletteOptions } from '../palette/palette.api';
import type { Context } from '../context';

/**
 * Couleur source du thème, résolue directement ou à partir du contexte.
 *
 * Une chaîne hexadécimale est la forme courte destinée à la configuration.
 * Elle est normalisée en `Color` dès qu'elle entre dans le moteur.
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
