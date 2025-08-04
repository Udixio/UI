import { FontRole, FontSize, FontStyle } from '@udixio/theme';
import plugin, { PluginAPI } from 'tailwindcss/plugin';

export interface FontPluginOptions {
  fontStyles: Record<FontRole, Record<FontSize, FontStyle>>;
  responsiveBreakPoints: Record<string, number>;
}

export const font = plugin.withOptions((options: FontPluginOptions) => {
  return ({
    addUtilities,
    theme,
  }: Pick<PluginAPI, 'addUtilities' | 'theme'>) => {
    const { fontStyles, responsiveBreakPoints } = options;

    const pixelUnit = 'rem';
    const newUtilities: Record<string, any> = {};

    const baseTextStyle = (sizeValue: FontStyle) => ({
      fontSize: sizeValue.fontSize + pixelUnit,
      fontWeight: sizeValue.fontWeight as unknown as any,
      lineHeight: sizeValue.lineHeight + pixelUnit,
      letterSpacing: sizeValue.letterSpacing
        ? sizeValue.letterSpacing + pixelUnit
        : null,
      fontFamily: theme('fontFamily.' + sizeValue.fontFamily),
    });

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
