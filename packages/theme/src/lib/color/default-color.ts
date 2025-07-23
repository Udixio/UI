import { DislikeAnalyzer } from '@material/material-color-utilities';
import { ContrastCurve, ToneDeltaPair } from '../material-color-utilities';
import { DynamicColor } from '../material-color-utilities/dynamic_color';
import { highestSurface } from './color.manager';
import { AddColorsOptions, ColorApi } from './color.api';
import { Hct } from '../material-color-utilities/htc';

export type DynamicColorKey =
  | 'background'
  | 'onBackground'
  | 'surface'
  | 'surfaceDim'
  | 'surfaceBright'
  | 'surfaceContainerLowest'
  | 'surfaceContainerLow'
  | 'surfaceContainer'
  | 'surfaceContainerHigh'
  | 'surfaceContainerHighest'
  | 'onSurface'
  | 'surfaceVariant'
  | 'onSurfaceVariant'
  | 'inverseSurface'
  | 'inverseOnSurface'
  | 'outline'
  | 'outlineVariant'
  | 'shadow'
  | 'scrim'
  | 'surfaceTint'
  | 'primary'
  | 'onPrimary'
  | 'primaryContainer'
  | 'onPrimaryContainer'
  | 'inversePrimary'
  | 'secondary'
  | 'onSecondary'
  | 'secondaryContainer'
  | 'onSecondaryContainer'
  | 'tertiary'
  | 'onTertiary'
  | 'tertiaryContainer'
  | 'onTertiaryContainer'
  | 'error'
  | 'onError'
  | 'errorContainer'
  | 'onErrorContainer'
  | 'primaryFixed'
  | 'primaryFixedDim'
  | 'onPrimaryFixed'
  | 'onPrimaryFixedVariant'
  | 'secondaryFixed'
  | 'secondaryFixedDim'
  | 'onSecondaryFixed'
  | 'onSecondaryFixedVariant'
  | 'tertiaryFixed'
  | 'tertiaryFixedDim'
  | 'onTertiaryFixed'
  | 'onTertiaryFixedVariant';

function findDesiredChromaByTone(
  hue: number,
  chroma: number,
  tone: number,
  byDecreasingTone: boolean,
): number {
  let answer = tone;

  let closestToChroma = Hct.from(hue, chroma, tone);
  if (closestToChroma.chroma < chroma) {
    let chromaPeak = closestToChroma.chroma;
    while (closestToChroma.chroma < chroma) {
      answer += byDecreasingTone ? -1.0 : 1.0;
      const potentialSolution = Hct.from(hue, chroma, answer);
      if (chromaPeak > potentialSolution.chroma) {
        break;
      }
      if (Math.abs(potentialSolution.chroma - chroma) < 0.4) {
        break;
      }

      const potentialDelta = Math.abs(potentialSolution.chroma - chroma);
      const currentDelta = Math.abs(closestToChroma.chroma - chroma);
      if (potentialDelta < currentDelta) {
        closestToChroma = potentialSolution;
      }
      chromaPeak = Math.max(chromaPeak, potentialSolution.chroma);
    }
  }

  return answer;
}

export const defaultColors: AddColorsOptions = (colorService: ColorApi) => ({
  fromPalettes: ['primary', 'secondary', 'tertiary'],
  colors: {
    // background: {
    //   palette: (s) => s.getPalette('neutral'),
    //   tone: (s) => (s.isDark ? 6 : 98),
    //   isBackground: true,
    // },
    // onBackground: {
    //   palette: (s) => s.getPalette('neutral'),
    //   tone: (s) => (s.isDark ? 90 : 10),
    //   background: (s) => colorService.getColor('background').getMaterialColor(),
    //   contrastCurve: (s) => new ContrastCurve(3, 3, 4.5, 7),
    // },
    surface: {
      palette: (s) => s.getPalette('neutral'),
      tone: (s) => {
        if (s.isDark) {
          return 4;
        } else {
          if (Hct.isYellow(s.getPalette('neutral').hue)) {
            return 99;
          } else {
            return 98;
          }
        }
      },
      isBackground: true,
    },
    surfaceDim: {
      palette: (s) => s.getPalette('neutral'),
      tone: (s) => {
        if (s.isDark) {
          return 4;
        } else {
          if (Hct.isYellow(s.getPalette('neutral').hue)) {
            return 90;
          } else {
            return 87;
          }
        }
      },
      isBackground: true,
      chromaMultiplier: (s) => {
        return 1;
      },
    },
    surfaceBright: {
      palette: (s) => s.getPalette('neutral'),
      tone: (s) => {
        if (s.isDark) {
          return 18;
        } else {
          if (Hct.isYellow(s.getPalette('neutral').hue)) {
            return 99;
          } else {
            return 98;
          }
        }
      },
      isBackground: true,
      chromaMultiplier: (s) => {
        return 1;
      },
    },
    surfaceContainerLowest: {
      palette: (s) => s.getPalette('neutral'),
      tone: (s) => (s.isDark ? 4 : 100),
      isBackground: true,
    },
    surfaceContainerLow: {
      palette: (s) => s.getPalette('neutral'),
      tone: (s) => (s.isDark ? 10 : 96),
      isBackground: true,
    },
    surfaceContainer: {
      palette: (s) => s.getPalette('neutral'),
      tone: (s) => (s.isDark ? 12 : 94),
      isBackground: true,
    },
    surfaceContainerHigh: {
      palette: (s) => s.getPalette('neutral'),
      tone: (s) => (s.isDark ? 17 : 92),
      isBackground: true,
    },
    surfaceContainerHighest: {
      palette: (s) => s.getPalette('neutral'),
      tone: (s) => (s.isDark ? 22 : 90),
      isBackground: true,
    },
    onSurface: {
      palette: (s) => s.getPalette('neutral'),
      tone: (s) => (s.isDark ? 90 : 10),
      background: (s) => highestSurface(s, colorService),
      contrastCurve: (s) => new ContrastCurve(4.5, 7, 11, 21),
    },
    surfaceVariant: {
      palette: (s) => s.getPalette('neutralVariant'),
      tone: (s) => (s.isDark ? 30 : 90),
      isBackground: true,
    },
    onSurfaceVariant: {
      palette: (s) => s.getPalette('neutralVariant'),
      tone: (s) => (s.isDark ? 80 : 30),
      background: (s) => highestSurface(s, colorService),
      contrastCurve: (s) => new ContrastCurve(3, 4.5, 7, 11),
    },
    inverseSurface: {
      palette: (s) => s.getPalette('neutral'),
      tone: (s) => (s.isDark ? 90 : 20),
    },
    inverseOnSurface: {
      palette: (s) => s.getPalette('neutral'),
      tone: (s) => (s.isDark ? 20 : 95),
      background: (s) =>
        colorService.getColor('inverseSurface').getMaterialColor(),
      contrastCurve: (s) => new ContrastCurve(4.5, 7, 11, 21),
    },
    outline: {
      palette: (s) => s.getPalette('neutralVariant'),
      tone: (s) => (s.isDark ? 60 : 50),
      background: (s) => highestSurface(s, colorService),
      contrastCurve: (s) => new ContrastCurve(1.5, 3, 4.5, 7),
    },
    outlineVariant: {
      palette: (s) => s.getPalette('neutralVariant'),
      tone: (s) => (s.isDark ? 30 : 80),
      background: (s) => highestSurface(s, colorService),
      contrastCurve: (s) => new ContrastCurve(1, 1, 3, 7),
    },
    shadow: {
      palette: (s) => s.getPalette('neutral'),
      tone: (s) => 0,
    },
    scrim: {
      palette: (s) => s.getPalette('neutral'),
      tone: (s) => 0,
    },
    surfaceTint: {
      palette: (s) => s.getPalette('neutral'),
      tone: (s) => (s.isDark ? 80 : 40),
      isBackground: true,
    },
    secondaryContainer: {
      tone: (s) => {
        const initialTone = s.isDark ? 30 : 90;
        return findDesiredChromaByTone(
          s.getPalette('secondary').hue,
          s.getPalette('secondary').chroma,
          initialTone,
          !s.isDark,
        );
      },
    },
    onSecondaryContainer: {
      tone: (s) => {
        return DynamicColor.foregroundTone(
          colorService
            .getColor('secondaryContainer')
            .getMaterialColor()
            .tone(s),
          4.5,
        );
      },
    },
    tertiaryContainer: {
      palette: (s) => s.getPalette('tertiary'),
      tone: (s) => {
        const proposedHct = s
          .getPalette('tertiary')
          .getHct(s.sourceColorHct.tone);
        return DislikeAnalyzer.fixIfDisliked(proposedHct).tone;
      },
    },
    onTertiaryContainer: {
      palette: (s) => s.getPalette('tertiary'),
      tone: (s) => {
        return DynamicColor.foregroundTone(
          colorService.getColor('tertiaryContainer').getMaterialColor().tone(s),
          4.5,
        );
      },
    },
    error: {
      palette: (s) => s.getPalette('error'),
      tone: (s) => (s.isDark ? 80 : 40),
      isBackground: true,
      background: (s) => highestSurface(s, colorService),
      contrastCurve: (s) => new ContrastCurve(3, 4.5, 7, 11),
      toneDeltaPair: (s) =>
        new ToneDeltaPair(
          colorService.getColor('errorContainer').getMaterialColor(),
          colorService.getColor('error').getMaterialColor(),
          15,
          'nearer',
          false,
        ),
    },
    onError: {
      palette: (s) => s.getPalette('error'),
      tone: (s) => (s.isDark ? 20 : 100),
      background: (s) => colorService.getColor('error').getMaterialColor(),
      contrastCurve: (s) => new ContrastCurve(4.5, 7, 11, 21),
    },
    errorContainer: {
      palette: (s) => s.getPalette('error'),
      tone: (s) => (s.isDark ? 30 : 90),
      isBackground: true,
      background: (s) => highestSurface(s, colorService),
      contrastCurve: (s) => new ContrastCurve(1, 1, 3, 7),
      toneDeltaPair: (s) =>
        new ToneDeltaPair(
          colorService.getColor('errorContainer').getMaterialColor(),
          colorService.getColor('error').getMaterialColor(),
          15,
          'nearer',
          false,
        ),
    },
    onErrorContainer: {
      palette: (s) => s.getPalette('error'),
      tone: (s) => (s.isDark ? 90 : 10),
      background: (s) =>
        colorService.getColor('errorContainer').getMaterialColor(),
      contrastCurve: (s) => new ContrastCurve(4.5, 7, 11, 21),
    },

    onTertiaryFixed: {
      palette: (s) => s.getPalette('tertiary'),
      tone: (s) => 10.0,
      background: (s) =>
        colorService.getColor('tertiaryFixedDim').getMaterialColor(),
      secondBackground: (s) =>
        colorService.getColor('tertiaryFixed').getMaterialColor(),
      contrastCurve: (s) => new ContrastCurve(4.5, 7, 11, 21),
    },
    onTertiaryFixedVariant: {
      palette: (s) => s.getPalette('tertiary'),
      tone: (s) => 30.0,
      background: (s) =>
        colorService.getColor('tertiaryFixedDim').getMaterialColor(),
      secondBackground: (s) =>
        colorService.getColor('tertiaryFixed').getMaterialColor(),
      contrastCurve: (s) => new ContrastCurve(3, 4.5, 7, 11),
    },
  },
});
