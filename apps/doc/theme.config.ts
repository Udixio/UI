import { defineConfig } from '@udixio/ui-react';
import { Context, Hct } from '@udixio/theme';

export const sourceColor =
  (hue = 161) =>
  ({ isDark }: Context) =>
    Hct.from(hue, 30, isDark ? 70 : 49);

export default defineConfig({
  sourceColor: sourceColor(),
  palettes: {
    // tertiary: "#D58A4E",
    secondary: ({ sourceColor }) => ({
      hue: sourceColor.hue,
      chroma: sourceColor.chroma * 0.66,
    }),
    tertiary: ({ sourceColor }) => ({
      hue: sourceColor.hue + 25,
      chroma: sourceColor.chroma,
    }),
    success: '#4CAF50',
    warning: '#FFA726',
    info: '#2196F3',
  },
  fontFamily: {
    expressive: ['var(--font-clash-grotesk)'],
    neutral: ['var(--font-inter)'],
  },
  fontStyles: {
    display: {
      large: {
        fontWeight: 600,
        fontSize: 5,
        lineHeight: 5.8,
      },
      medium: {
        fontWeight: 600,
        fontSize: 4,
        lineHeight: 4.5,
      },
      small: {
        fontWeight: 600,
        fontSize: 3,
        lineHeight: 3.5,
      },
    },
    headline: {
      large: {
        fontWeight: 500,
        fontSize: 2.5,
        lineHeight: 3.5,
      },
      medium: {
        fontWeight: 500,
        fontSize: 2,
        lineHeight: 2.6,
      },
      small: {
        fontWeight: 500,
        fontSize: 1.5,
        lineHeight: 2,
      },
    },
    // title: {
    //     large: {
    //         fontWeight: 500,
    //     },
    //     medium: {
    //         fontWeight: 500,
    //     },
    //     small: {
    //         fontWeight: 500,
    //     },
    // },
  },
  responsiveBreakPoints: {
    lg: 1.2,
    xl: 1.4,
  },
  subThemes: {
    warning: '#e5bb79',
    success: '#2ec038',
    // purple: "#7852A9",
    // orange: '#F5704B'
  },
});
