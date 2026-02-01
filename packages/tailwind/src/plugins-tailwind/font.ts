import { FontRole, FontSize, FontStyle } from '@udixio/theme';
import plugin, { PluginAPI } from 'tailwindcss/plugin';

export interface FontPluginOptions {
  fontStyles: Record<FontRole, Record<FontSize, FontStyle>>;
  responsiveBreakPoints: Record<string, number>;
  fontFamily: {
    expressive: string[];
    neutral: string[];
  };
}

export const font = plugin.withOptions((options: FontPluginOptions) => {
  return ({
    addUtilities,
    theme,
  }: Pick<PluginAPI, 'addUtilities' | 'theme'>) => {
    const { fontStyles, responsiveBreakPoints, fontFamily } = options;

    const pixelUnit = 'rem';
    const newUtilities: Record<string, any> = {};

    const baseTextStyle = (sizeValue: FontStyle) => {
      const fontFamilyArray = fontFamily[sizeValue.fontFamily as keyof typeof fontFamily];

      // Process font family: keep var() without quotes, add quotes to others
      const processedFontFamily = fontFamilyArray
        .map((font) => (font.trim().startsWith('var(') ? font : `"${font}"`))
        .join(', ');

      return {
        fontSize: sizeValue.fontSize + pixelUnit,
        fontWeight: sizeValue.fontWeight as unknown as any,
        lineHeight: sizeValue.lineHeight + pixelUnit,
        letterSpacing: sizeValue.letterSpacing
          ? sizeValue.letterSpacing + pixelUnit
          : null,
        fontFamily: processedFontFamily,
      };
    };

    const responsiveTextStyle = (
      sizeValue: FontStyle,
      breakPointName: string,
      breakPointRatio: number,
    ) => ({
      [`@media (min-width: ${theme('screens.' + breakPointName, {})})`]: {
        fontSize: sizeValue.fontSize * breakPointRatio + pixelUnit,
        lineHeight: sizeValue.lineHeight * breakPointRatio + pixelUnit,
      },
    });

    for (const [roleName, roleValue] of Object.entries(fontStyles)) {
      for (const [sizeName, sizeValue] of Object.entries(roleValue)) {
        newUtilities[`.text-${roleName}-${sizeName}`] = {
          ...baseTextStyle(sizeValue),
          ...Object.entries(responsiveBreakPoints).reduce(
            (acc, [breakPointName, breakPointRatio]) => ({
              ...acc,
              ...responsiveTextStyle(
                sizeValue,
                breakPointName,
                breakPointRatio,
              ),
            }),
            {},
          ),
        };
      }
    }

    addUtilities(newUtilities);
  };
});
