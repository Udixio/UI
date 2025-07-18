import { FontRole, FontSize, FontStyle } from '../../font/font.plugin';
import plugin, { PluginAPI } from 'tailwindcss/plugin';

export const font = (
  fontStyles: Record<FontRole, Record<FontSize, FontStyle>>,
  responsiveBreakPoints: Record<string, number>,
) => {
  const createUtilities = ({ theme }: Pick<PluginAPI, 'theme'>): any => {
    const pixelUnit = 'rem';
    const newUtilities: any = {};

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
        newUtilities['.text-' + roleName + '-' + sizeName] = {
          ...baseTextStyle(sizeValue),
          ...Object.entries(responsiveBreakPoints).reduce(
            (acc, [breakPointName, breakPointRatio]) => {
              acc = {
                ...acc,
                ...responsiveTextStyle(
                  sizeValue,
                  breakPointName,
                  breakPointRatio,
                ),
              };
              return acc;
            },
            {},
          ),
        };
      }
    }

    return newUtilities as any;
  };
  return plugin(
    ({
      addUtilities,
      theme,
    }: Pick<PluginAPI, 'theme'> & Pick<PluginAPI, 'addUtilities'>) => {
      const newUtilities = createUtilities({ theme });
      addUtilities(newUtilities);
    },
  );
};
