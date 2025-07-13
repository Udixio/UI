import { DislikeAnalyzer, Hct } from '@material/material-color-utilities';
import { ContrastCurve, ToneDeltaPair } from '../../material-color-utilities';
import { DynamicColor } from '../../material-color-utilities/dynamic_color';
import { Injectable } from '@nestjs/common';
import { ColorOptions } from '../entities/color.entity';
import { ColorManagerService } from '../color-manager.service';

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
  byDecreasingTone: boolean
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

@Injectable()
export class DefaultColorModel {
  colors: Partial<
    Record<DynamicColorKey, Partial<Omit<ColorOptions, 'name'>>>
  > = {
    background: {
      palette: (s) => s.getPalette('neutral'),
      tone: (s) => (s.isDark ? 6 : 98),
      isBackground: true,
    },
    onBackground: {
      palette: (s) => s.getPalette('neutral'),
      tone: (s) => (s.isDark ? 90 : 10),
      background: (s) =>
        this.dynamicColorService.get('background').getDynamicColor(),
      contrastCurve: new ContrastCurve(3, 3, 4.5, 7),
    },
    surface: {
      palette: (s) => s.getPalette('neutral'),
      tone: (s) => (s.isDark ? 6 : 98),
      isBackground: true,
    },
    surfaceDim: {
      palette: (s) => s.getPalette('neutral'),
      tone: (s) => (s.isDark ? 6 : 87),
      isBackground: true,
    },
    surfaceBright: {
      palette: (s) => s.getPalette('neutral'),
      tone: (s) => (s.isDark ? 24 : 98),
      isBackground: true,
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
      background: (s) => this.dynamicColorService.highestSurface(s),
      contrastCurve: new ContrastCurve(4.5, 7, 11, 21),
    },
    surfaceVariant: {
      palette: (s) => s.getPalette('neutralVariant'),
      tone: (s) => (s.isDark ? 30 : 90),
      isBackground: true,
    },
    onSurfaceVariant: {
      palette: (s) => s.getPalette('neutralVariant'),
      tone: (s) => (s.isDark ? 80 : 30),
      background: (s) => this.dynamicColorService.highestSurface(s),
      contrastCurve: new ContrastCurve(3, 4.5, 7, 11),
    },
    inverseSurface: {
      palette: (s) => s.getPalette('neutral'),
      tone: (s) => (s.isDark ? 90 : 20),
    },
    inverseOnSurface: {
      palette: (s) => s.getPalette('neutral'),
      tone: (s) => (s.isDark ? 20 : 95),
      background: (s) =>
        this.dynamicColorService.get('inverseSurface').getDynamicColor(),
      contrastCurve: new ContrastCurve(4.5, 7, 11, 21),
    },
    outline: {
      palette: (s) => s.getPalette('neutralVariant'),
      tone: (s) => (s.isDark ? 60 : 50),
      background: (s) => this.dynamicColorService.highestSurface(s),
      contrastCurve: new ContrastCurve(1.5, 3, 4.5, 7),
    },
    outlineVariant: {
      palette: (s) => s.getPalette('neutralVariant'),
      tone: (s) => (s.isDark ? 30 : 80),
      background: (s) => this.dynamicColorService.highestSurface(s),
      contrastCurve: new ContrastCurve(1, 1, 3, 7),
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
          !s.isDark
        );
      },
    },
    onSecondaryContainer: {
      tone: (s) => {
        return DynamicColor.foregroundTone(
          this.dynamicColorService
            .get('secondaryContainer')
            .getDynamicColor()
            .tone(s),
          4.5
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
          this.dynamicColorService
            .get('tertiaryContainer')
            .getDynamicColor()
            .tone(s),
          4.5
        );
      },
    },
    error: {
      palette: (s) => s.getPalette('error'),
      tone: (s) => (s.isDark ? 80 : 40),
      isBackground: true,
      background: (s) => this.dynamicColorService.highestSurface(s),
      contrastCurve: new ContrastCurve(3, 4.5, 7, 11),
      toneDeltaPair: (s) =>
        new ToneDeltaPair(
          this.dynamicColorService.get('errorContainer').getDynamicColor(),
          this.dynamicColorService.get('error').getDynamicColor(),
          15,
          'nearer',
          false
        ),
    },
    onError: {
      palette: (s) => s.getPalette('error'),
      tone: (s) => (s.isDark ? 20 : 100),
      background: (s) =>
        this.dynamicColorService.get('error').getDynamicColor(),
      contrastCurve: new ContrastCurve(4.5, 7, 11, 21),
    },
    errorContainer: {
      palette: (s) => s.getPalette('error'),
      tone: (s) => (s.isDark ? 30 : 90),
      isBackground: true,
      background: (s) => this.dynamicColorService.highestSurface(s),
      contrastCurve: new ContrastCurve(1, 1, 3, 7),
      toneDeltaPair: (s) =>
        new ToneDeltaPair(
          this.dynamicColorService.get('errorContainer').getDynamicColor(),
          this.dynamicColorService.get('error').getDynamicColor(),
          15,
          'nearer',
          false
        ),
    },
    onErrorContainer: {
      palette: (s) => s.getPalette('error'),
      tone: (s) => (s.isDark ? 90 : 10),
      background: (s) =>
        this.dynamicColorService.get('errorContainer').getDynamicColor(),
      contrastCurve: new ContrastCurve(4.5, 7, 11, 21),
    },

    onTertiaryFixed: {
      palette: (s) => s.getPalette('tertiary'),
      tone: (s) => 10.0,
      background: (s) =>
        this.dynamicColorService.get('tertiaryFixedDim').getDynamicColor(),
      secondBackground: (s) =>
        this.dynamicColorService.get('tertiaryFixed').getDynamicColor(),
      contrastCurve: new ContrastCurve(4.5, 7, 11, 21),
    },
    onTertiaryFixedVariant: {
      palette: (s) => s.getPalette('tertiary'),
      tone: (s) => 30.0,
      background: (s) =>
        this.dynamicColorService.get('tertiaryFixedDim').getDynamicColor(),
      secondBackground: (s) =>
        this.dynamicColorService.get('tertiaryFixed').getDynamicColor(),
      contrastCurve: new ContrastCurve(3, 4.5, 7, 11),
    },
  };

  constructor(private dynamicColorService: ColorManagerService) {}
}
