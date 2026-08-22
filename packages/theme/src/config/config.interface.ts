import type { API } from '../API';
import type { ColorValueInput, FromPaletteOptions } from '../color/color.types';
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
export type SourceColor =
  | ColorValueInput
  | ((context: Context) => ColorValueInput);

/** Une collection de définitions de couleurs, éventuellement calculée par l'API. */
export type ColorConfigRecord<Value> =
  | Record<string, Value>
  | ((api: API) => Record<string, Value>);

/** Valeurs directes et références, sans recette de palette. */
export type StaticColorDefinition =
  | ColorValueInput
  | { alias: string };

export interface ColorsConfig {
  /** Couleurs directes. Elles ne suivent pas les palettes du thème. */
  static?: ColorConfigRecord<StaticColorDefinition>;
  /** Couleurs dynamiques résolues depuis une palette. */
  fromPalette?: ColorConfigRecord<FromPaletteOptions>;
}

export interface ConfigInterface {
  sourceColor: SourceColor;
  contrastLevel?: number;
  isDark?: boolean;
  variant?: Variant;
  colors?: ColorsConfig;
  palettes?: PaletteOptions;
  plugins?: PluginAbstract<any, any>[];
}
