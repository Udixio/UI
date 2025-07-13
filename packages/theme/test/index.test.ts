import { main } from '../src';
import { ContrastCurve, ToneDeltaPair } from '../src/material-color-utilities';
import {
  sanitizeDegreesDouble,
  TonalPalette,
} from '@material/material-color-utilities';

describe('AppController (e2e)', () => {
  it('/ (GET)', async () => {
    let sourceColorHex = '#0965EC';
    const [{ colorService, themeService }, close] = await main();

    themeService.create({
      contrastLevel: 0,
      isDark: false,
      sourceColorHex,
    });

    themeService.addVariant({
      palettes: {
        primary: (sourceColorHct) =>
          TonalPalette.fromHueAndChroma(sourceColorHct.hue, 200.0),
        secondary: (sourceColorHct) =>
          TonalPalette.fromHueAndChroma(
            sanitizeDegreesDouble(sourceColorHct.hue + 20),
            40.0
          ),
        tertiary: (sourceColorHct) =>
          TonalPalette.fromHueAndChroma(
            sanitizeDegreesDouble(sourceColorHct.hue + 60.0),
            120.0
          ),
        neutral: (sourceColorHct) =>
          TonalPalette.fromHueAndChroma(sourceColorHct.hue, 6.0),
        neutralVariant: (sourceColorHct) =>
          TonalPalette.fromHueAndChroma(sourceColorHct.hue, 8.0),
      },
    });

    colorService.addColors({
      primary: {
        palette: (s) => s.getPalette('primary'),
        tone: (s) => s.sourceColorHct.tone,
        isBackground: true,
        background: (s) =>
          s.isDark
            ? colorService.getColor('surfaceBright').getDynamicColor()
            : colorService.getColor('surfaceDim').getDynamicColor(),
        contrastCurve: new ContrastCurve(1, 1, 3, 7),
        toneDeltaPair: (s) =>
          new ToneDeltaPair(
            colorService.getColor('primaryContainer').getDynamicColor(),
            colorService.getColor('primary').getDynamicColor(),
            15,
            'nearer',
            false
          ),
      },
      primaryContainer: {
        palette: (s) => s.getPalette('primary'),
        tone: (s) => {
          return s.isDark ? 30 : 90;
        },
        isBackground: true,
        background: (s) =>
          s.isDark
            ? colorService.getColor('surfaceBright').getDynamicColor()
            : colorService.getColor('surfaceDim').getDynamicColor(),
        contrastCurve: new ContrastCurve(1, 1.125, 3, 7),
        toneDeltaPair: (s) =>
          new ToneDeltaPair(
            colorService.getColor('primaryContainer').getDynamicColor(),
            colorService.getColor('primary').getDynamicColor(),
            15,
            'nearer',
            false
          ),
      },
      secondary: {
        palette: (s) => s.getPalette('secondary'),
        tone: (s) => s.sourceColorHct.tone,
        isBackground: true,
        background: (s) =>
          s.isDark
            ? colorService.getColor('surfaceBright').getDynamicColor()
            : colorService.getColor('surfaceDim').getDynamicColor(),
        contrastCurve: new ContrastCurve(3, 3, 7, 11),
        toneDeltaPair: (s) =>
          new ToneDeltaPair(
            colorService.getColor('secondaryContainer').getDynamicColor(),
            colorService.getColor('primary').getDynamicColor(),
            15,
            'nearer',
            false
          ),
      },
      secondaryContainer: {
        palette: (s) => s.getPalette('secondary'),
        tone: (s) => {
          return s.isDark ? 30 : 90;
        },
        isBackground: true,
        background: (s) =>
          s.isDark
            ? colorService.getColor('surfaceBright').getDynamicColor()
            : colorService.getColor('surfaceDim').getDynamicColor(),
        contrastCurve: new ContrastCurve(1, 1.125, 3, 7),
        toneDeltaPair: (s) =>
          new ToneDeltaPair(
            colorService.getColor('secondaryContainer').getDynamicColor(),
            colorService.getColor('secondary').getDynamicColor(),
            15,
            'nearer',
            false
          ),
      },
      tertiary: {
        palette: (s) => s.getPalette('tertiary'),
        tone: (s) => s.sourceColorHct.tone,
        isBackground: true,
        background: (s) =>
          s.isDark
            ? colorService.getColor('surfaceBright').getDynamicColor()
            : colorService.getColor('surfaceDim').getDynamicColor(),
        contrastCurve: new ContrastCurve(3, 3, 7, 11),
      },
    });

    colorService.addColor('surfaceBright', {
      palette: (s) => s.getPalette('neutral'),
      tone: (s) => (s.isDark ? 24 : 98),
      isBackground: true,
    });
    colorService.addColor('surfaceDim', {
      palette: (s) => s.getPalette('neutral'),
      tone: (s) => (s.isDark ? 6 : 87),
      isBackground: true,
    });

    console.log(
      [...colorService.getAllColors().values()].map((colorEntity) => ({
        name: colorEntity.getName(),
        hex: colorEntity.getHex(),
      }))
    );
    themeService.update({
      sourceColorHex: '#3eee31',
    });

    console.log(
      [...colorService.getAllColors().values()].map((colorEntity) => ({
        name: colorEntity.getName(),
        hex: colorEntity.getHex(),
      }))
    );
    await close();
  });
});
