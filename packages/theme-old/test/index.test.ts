// import { main } from '../src';
import {
  bootstrap,
  bootstrapFromConfig,
  ContrastCurve,
  createTheme,
  defaultColors,
  ToneDeltaPair,
  VariantEntity,
} from '../src';
import {
  sanitizeDegreesDouble,
  TonalPalette,
} from '@material/material-color-utilities';

describe('AppController (e2e)', () => {
  it('ffr', async () => {
    console.log(createTheme());
  });

  it('ff', async () => {
    const { colorService, themeService } = bootstrapFromConfig();
    console.log(
      [...colorService.getColors().values()].map((colorEntity) => ({
        name: colorEntity.getName(),
        hex: colorEntity.getHex(),
      }))
    );
  });

  it('/ (GET)', async () => {
    let sourceColorHex = '#0965EC';
    const { colorService, themeService } = bootstrap();
    console.log('colorService', colorService);

    const variant: VariantEntity = {
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
    };
    themeService.create({
      contrastLevel: 0,
      isDark: false,
      sourceColorHex,
      variant,
    });

    colorService.addColors(defaultColors);

    colorService.addColors({
      colors: {
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

    themeService.update({
      sourceColorHex: '#3eee31',
    });

    console.log(
      [...colorService.getColors().values()].map((colorEntity) => ({
        name: colorEntity.getName(),
        hex: colorEntity.getHex(),
      }))
    );
  });
});
