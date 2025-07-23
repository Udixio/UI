import {
  clampDouble,
  DislikeAnalyzer,
  TonalPalette,
} from '@material/material-color-utilities';
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

function getCurve(defaultContrast: number): ContrastCurve {
  if (defaultContrast === 1.5) {
    return new ContrastCurve(1.5, 1.5, 3, 4.5);
  } else if (defaultContrast === 3) {
    return new ContrastCurve(3, 3, 4.5, 7);
  } else if (defaultContrast === 4.5) {
    return new ContrastCurve(4.5, 4.5, 7, 11);
  } else if (defaultContrast === 6) {
    return new ContrastCurve(6, 6, 7, 11);
  } else if (defaultContrast === 7) {
    return new ContrastCurve(7, 7, 11, 21);
  } else if (defaultContrast === 9) {
    return new ContrastCurve(9, 9, 11, 21);
  } else if (defaultContrast === 11) {
    return new ContrastCurve(11, 11, 21, 21);
  } else if (defaultContrast === 21) {
    return new ContrastCurve(21, 21, 21, 21);
  } else {
    // Shouldn't happen.
    return new ContrastCurve(defaultContrast, defaultContrast, 7, 21);
  }
}

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

function tMaxC(
  palette: TonalPalette,
  lowerBound: number = 0,
  upperBound: number = 100,
  chromaMultiplier: number = 1,
): number {
  let answer = findBestToneForChroma(
    palette.hue,
    palette.chroma * chromaMultiplier,
    100,
    true,
  );
  return clampDouble(lowerBound, upperBound, answer);
}

function tMinC(
  palette: TonalPalette,
  lowerBound: number = 0,
  upperBound: number = 100,
): number {
  let answer = findBestToneForChroma(palette.hue, palette.chroma, 0, false);
  return clampDouble(lowerBound, upperBound, answer);
}

function findBestToneForChroma(
  hue: number,
  chroma: number,
  tone: number,
  byDecreasingTone: boolean,
): number {
  let answer = tone;
  let bestCandidate = Hct.from(hue, chroma, answer);
  while (bestCandidate.chroma < chroma) {
    if (tone < 0 || tone > 100) {
      break;
    }
    tone += byDecreasingTone ? -1.0 : 1.0;
    const newCandidate = Hct.from(hue, chroma, tone);
    if (bestCandidate.chroma < newCandidate.chroma) {
      bestCandidate = newCandidate;
      answer = tone;
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
          } else if (s.variant === 'vibrant') {
            return 97;
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
          } else if (s.variant === 'vibrant') {
            return 85;
          } else {
            return 87;
          }
        }
      },
      isBackground: true,
      chromaMultiplier: (s) => {
        if (!s.isDark) {
          if (s.variant === 'neutral') {
            return 2.5;
          } else if (s.variant === 'tonalSpot') {
            return 1.7;
          } else if (s.variant === 'expressive') {
            return Hct.isYellow(s.getPalette('neutral').hue) ? 2.7 : 1.75;
          } else if (s.variant === 'vibrant') {
            return 1.36;
          }
        }
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
          } else if (s.variant === 'vibrant') {
            return 97;
          } else {
            return 98;
          }
        }
      },
      isBackground: true,
      chromaMultiplier: (s) => {
        if (s.isDark) {
          if (s.variant === 'neutral') {
            return 2.5;
          } else if (s.variant === 'tonalSpot') {
            return 1.7;
          } else if (s.variant === 'expressive') {
            return Hct.isYellow(s.getPalette('neutral').hue) ? 2.7 : 1.75;
          } else if (s.variant === 'vibrant') {
            return 1.36;
          }
        }
        return 1;
      },
    },
    surfaceContainerLowest: {
      palette: (s) => s.getPalette('neutral'),
      tone: (s) => (s.isDark ? 0 : 100),
      isBackground: true,
    },
    surfaceContainerLow: {
      palette: (s) => s.getPalette('neutral'),
      tone: (s) => {
        if (s.isDark) {
          return 6;
        } else {
          if (Hct.isYellow(s.getPalette('neutral').hue)) {
            return 98;
          } else if (s.variant === 'vibrant') {
            return 95;
          } else {
            return 96;
          }
        }
      },
      isBackground: true,
      chromaMultiplier: (s) => {
        if (s.variant === 'neutral') {
          return 1.3;
        } else if (s.variant === 'tonalSpot') {
          return 1.25;
        } else if (s.variant === 'expressive') {
          return Hct.isYellow(s.getPalette('neutral').hue) ? 1.3 : 1.15;
        } else if (s.variant === 'vibrant') {
          return 1.08;
        }
        return 1;
      },
    },
    surfaceContainer: {
      palette: (s) => s.getPalette('neutral'),
      tone: (s) => {
        if (s.isDark) {
          return 9;
        } else {
          if (Hct.isYellow(s.getPalette('neutral').hue)) {
            return 96;
          } else if (s.variant === 'vibrant') {
            return 92;
          } else {
            return 94;
          }
        }
      },
      isBackground: true,
      chromaMultiplier: (s) => {
        if (s.variant === 'neutral') {
          return 1.6;
        } else if (s.variant === 'tonalSpot') {
          return 1.4;
        } else if (s.variant === 'expressive') {
          return Hct.isYellow(s.getPalette('neutral').hue) ? 1.6 : 1.3;
        } else if (s.variant === 'vibrant') {
          return 1.15;
        }
        return 1;
      },
    },
    surfaceContainerHigh: {
      palette: (s) => s.getPalette('neutral'),
      tone: (s) => {
        if (s.isDark) {
          return 12;
        } else {
          if (Hct.isYellow(s.getPalette('neutral').hue)) {
            return 94;
          } else if (s.variant === 'vibrant') {
            return 90;
          } else {
            return 92;
          }
        }
      },
      isBackground: true,
      chromaMultiplier: (s) => {
        if (s.variant === 'neutral') {
          return 1.9;
        } else if (s.variant === 'tonalSpot') {
          return 1.5;
        } else if (s.variant === 'expressive') {
          return Hct.isYellow(s.getPalette('neutral').hue) ? 1.95 : 1.45;
        } else if (s.variant === 'vibrant') {
          return 1.22;
        }
        return 1;
      },
    },
    surfaceContainerHighest: {
      palette: (s) => s.getPalette('neutral'),
      tone: (s) => {
        if (s.isDark) {
          return 15;
        } else {
          if (Hct.isYellow(s.getPalette('neutral').hue)) {
            return 92;
          } else if (s.variant === 'vibrant') {
            return 88;
          } else {
            return 90;
          }
        }
      },
      isBackground: true,
      chromaMultiplier: (s) => {
        if (s.variant === 'neutral') {
          return 2.2;
        } else if (s.variant === 'tonalSpot') {
          return 1.7;
        } else if (s.variant === 'expressive') {
          return Hct.isYellow(s.getPalette('neutral').hue) ? 2.3 : 1.6;
        } else if (s.variant === 'vibrant') {
          return 1.29;
        } else {
          // default
          return 1;
        }
      },
    },
    onSurface: {
      palette: (s) => s.getPalette('neutral'),
      tone: (s) => {
        if (s.variant === 'vibrant') {
          return tMaxC(s.getPalette('neutral'), 0, 100, 1.1);
        } else {
          // For all other variants, the initial tone should be the default
          // tone, which is the same as the background color.
          return DynamicColor.getInitialToneFromBackground((s) =>
            highestSurface(s, colorService),
          )(s);
        }
      },
      chromaMultiplier: (s) => {
        if (s.variant === 'neutral') {
          return 2.2;
        } else if (s.variant === 'tonalSpot') {
          return 1.7;
        } else if (s.variant === 'expressive') {
          return Hct.isYellow(s.getPalette('neutral').hue)
            ? s.isDark
              ? 3.0
              : 2.3
            : 1.6;
        }

        return 1;
      },
      background: (s) => highestSurface(s, colorService),
      contrastCurve: (s) => (s.isDark ? getCurve(11) : getCurve(9)),
    },
    surfaceVariant: {
      alias: 'surfaceContainerHighest',
    },
    onSurfaceVariant: {
      palette: (s) => s.getPalette('neutralVariant'),
      chromaMultiplier: (s) => {
        if (s.variant === 'neutral') {
          return 2.2;
        } else if (s.variant === 'tonalSpot') {
          return 1.7;
        } else if (s.variant === 'expressive') {
          return Hct.isYellow(s.getPalette('neutral').hue)
            ? s.isDark
              ? 3.0
              : 2.3
            : 1.6;
        }

        return 1;
      },
      background: (s) => highestSurface(s, colorService),
      contrastCurve: (s) => (s.isDark ? getCurve(6) : getCurve(4.5)),
    },
    inverseSurface: {
      palette: (s) => s.getPalette('neutral'),
      tone: (s) => (s.isDark ? 98 : 4),
      isBackground: true,
    },
    inverseOnSurface: {
      palette: (s) => s.getPalette('neutral'),
      tone: (s) => (s.isDark ? 20 : 95),
      background: (s) =>
        colorService.getColor('inverseSurface').getMaterialColor(),
      contrastCurve: (s) => getCurve(7),
    },
    outline: {
      palette: (s) => s.getPalette('neutralVariant'),
      chromaMultiplier: (s) => {
        if (s.variant === 'neutral') {
          return 2.2;
        } else if (s.variant === 'tonalSpot') {
          return 1.7;
        } else if (s.variant === 'expressive') {
          return Hct.isYellow(s.getPalette('neutral').hue)
            ? s.isDark
              ? 3.0
              : 2.3
            : 1.6;
        }
        return 1;
      },
      background: (s) => highestSurface(s, colorService),
      contrastCurve: (s) => getCurve(3),
    },
    outlineVariant: {
      palette: (s) => s.getPalette('neutralVariant'),
      chromaMultiplier: (s) => {
        if (s.variant === 'neutral') {
          return 2.2;
        } else if (s.variant === 'tonalSpot') {
          return 1.7;
        } else if (s.variant === 'expressive') {
          return Hct.isYellow(s.getPalette('neutral').hue)
            ? s.isDark
              ? 3.0
              : 2.3
            : 1.6;
        }

        return 1;
      },
      background: (s) => highestSurface(s, colorService),
      contrastCurve: (s) => getCurve(1.5),
    },
    surfaceTint: {
      alias: 'primary',
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
