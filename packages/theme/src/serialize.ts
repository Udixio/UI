import { API } from './API';

export interface ThemeContextSnapshot {
  isDark: boolean;
  contrastLevel: number;
  sourceColor: { hue: number; chroma: number; tone: number };
  variantName: string;
  palettes: Record<string, { hue: number; chroma: number }>;
}

export function serializeThemeContext(api: API): ThemeContextSnapshot {
  const sc = api.context.sourceColor;
  return {
    isDark: api.context.isDark,
    contrastLevel: api.context.contrastLevel,
    sourceColor: { hue: sc.hue, chroma: sc.chroma, tone: sc.tone },
    variantName: api.context.variant.name,
    palettes: api.palettes.getSerializableState(),
  };
}
