import { API } from './API';

export interface ThemeContextSnapshot {
  isDark: boolean;
  contrastLevel: number;
  sourceColor: { hue: number; chroma: number; tone: number };
  variantName: string;
  palettes: Record<string, { hue: number; chroma: number }>;
  /** The configured colors, resolved: their callbacks do not serialize. */
  colors: Record<string, { hue: number; chroma: number; tone: number }>;
}

export function serializeThemeContext(api: API): ThemeContextSnapshot {
  const sc = api.context.sourceColor;
  return {
    isDark: api.context.isDark,
    contrastLevel: api.context.contrastLevel,
    sourceColor: { hue: sc.hue, chroma: sc.chroma, tone: sc.tone },
    variantName: api.context.variant.name,
    palettes: api.palettes.getSerializableState(),
    colors: Object.fromEntries(
      api.colors.getConfiguredColorKeys().map((key) => {
        const color = api.colors.get(key);
        return [
          key,
          { hue: color.hue, chroma: color.chroma, tone: color.tone },
        ];
      }),
    ),
  };
}
