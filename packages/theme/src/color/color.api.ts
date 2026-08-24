import {
  applyToneDelta,
  avoidBackgroundGap,
  backgroundGapTone,
  contrastAgainst,
  contrastTone,
  onColor,
} from './tone-adjusters';
import { Color } from './color.base';
import type { ColorDefinition, ColorInput, ColorsConfig } from './color.types';
import { ColorManager } from './color.manager';
import { DynamicColorKey, tMaxC, tMinC } from './color.utils';
import { API } from '../API';

import { Context } from 'src/context';

function highestSurface(context: Context, colors: ColorApi): Color {
  return context.isDark
    ? colors.get('surfaceBright')
    : colors.get('surfaceDim');
}

export function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

/** @deprecated Use `ColorsConfig` instead. */
export type AddColorsOptions = ColorsConfig;

export class ColorApi {
  private readonly colorManager: ColorManager;
  private readonly context: Context;
  private readonly configuredColorLayers: ColorsConfig[] = [];
  private readonly customPaletteKeys = new Set<string>();
  private rebuilding = false;
  public api?: API;

  constructor({
    colorManager,
    context,
  }: {
    colorManager: ColorManager;
    context: Context;
  }) {
    this.context = context;
    this.colorManager = colorManager;

    this.context.onUpdate((changed) => {
      if (changed.includes('variant')) {
        this.rebuild();
      }
    });
  }

  get version(): number {
    return this.colorManager.version;
  }

  getAll() {
    return this.colorManager.getAll();
  }

  addColor(key: string, color: ColorInput): Color {
    return this.colorManager.createOrUpdate(key, color);
  }

  addColors(args: ColorsConfig) {
    if (!this.api)
      throw new Error(
        'The API is not initialized. Please call bootstrap() before calling addColors().',
      );

    if (typeof args === 'function') {
      args = args(this.api);
    }
    if (args) {
      Object.entries(args).forEach(([name, colorDefinition]) => {
        this.addColorDefinition(name, colorDefinition);
      });
    }
  }

  /** Enregistre une couche de configuration à reconstruire avec le variant. */
  addConfiguredColors(args: ColorsConfig): void {
    this.configuredColorLayers.push(args);
    this.addColors(args);
  }

  get(key: DynamicColorKey | string): Color {
    return this.colorManager.get(key);
  }

  remove(key: string): boolean {
    return this.colorManager.remove(key);
  }

  update(key: string, newColor: ColorInput): Color {
    return this.colorManager.createOrUpdate(key, newColor);
  }

  private addColorDefinition(key: string, definition: ColorDefinition): Color {
    if (typeof definition !== 'function') {
      return this.addColor(key, definition);
    }

    const current = this.colorManager.get(key);
    return this.colorManager.createOrUpdate(
      key,
      current.beforeResolution(definition),
    );
  }

  addFromCustomPalette(key: string): void {
    this.customPaletteKeys.add(key);

    if (this.context.variant.colorsFromCustomPalette) {
      return this.addColors(this.context.variant.colorsFromCustomPalette(key));
    }

    const colorKey = key as DynamicColorKey;
    const colorDimKey = (colorKey + 'Dim') as DynamicColorKey;
    const ColorKey = capitalizeFirstLetter(key);
    const onColorKey = ('on' + ColorKey) as DynamicColorKey;
    const colorContainerKey = (colorKey + 'Container') as DynamicColorKey;
    const onColorContainerKey = ('on' +
      ColorKey +
      'Container') as DynamicColorKey;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const inverseColorKey = ('inverse' + ColorKey) as DynamicColorKey;
    const colorFixedKey = (colorKey + 'Fixed') as DynamicColorKey;
    const colorFixedDimKey = (colorKey + 'FixedDim') as DynamicColorKey;
    const onColorFixedKey = ('on' + ColorKey + 'Fixed') as DynamicColorKey;
    const onColorFixedVariantKey = ('on' +
      ColorKey +
      'FixedVariant') as DynamicColorKey;
    const colors: ColorsConfig = ({ palettes, colors, context: ctx }) => ({
      [colorKey]: Color.fromPalette(colorKey, {
        tone: () => {
          if (ctx.variant.name === 'neutral') {
            return ctx.isDark
              ? tMinC(palettes.get(colorKey), 0, 98)
              : tMaxC(palettes.get(colorKey));
          } else if (ctx.variant.name === 'vibrant') {
            return tMaxC(palettes.get(colorKey), 0, ctx.isDark ? 90 : 98);
          } else {
            return ctx.isDark ? 80 : tMaxC(palettes.get(colorKey));
          }
        },
        adjustTone: [
          applyToneDelta({
            relativeTo: colorContainerKey,
            delta: 5,
            polarity: 'relativeDarker',
            constraint: 'farther',
          }),
          contrastAgainst(() => highestSurface(ctx, colors), 4.5),
          avoidBackgroundGap(),
        ],
      }),
      [colorDimKey]: Color.fromPalette(colorKey, {
        tone: () => {
          if (ctx.variant.name === 'neutral') {
            return 85;
          } else {
            return tMaxC(palettes.get(colorKey), 0, 90);
          }
        },
        adjustTone: [
          applyToneDelta({
            relativeTo: colorDimKey,
            delta: 5,
            polarity: 'lighter',
            constraint: 'farther',
          }),
          contrastAgainst('surfaceContainerHigh', 4.5),
          avoidBackgroundGap(),
        ],
      }),
      [onColorKey]: Color.fromPalette(colorKey, {
        adjustTone: onColor(colorKey, 6),
      }),
      [colorContainerKey]: Color.fromPalette(colorKey, {
        tone: () => {
          if (ctx.variant.name === 'vibrant') {
            return ctx.isDark
              ? tMinC(palettes.get(colorKey), 30, 40)
              : tMaxC(palettes.get(colorKey), 84, 90);
          } else if (ctx.variant.name === 'expressive') {
            return ctx.isDark ? 15 : tMaxC(palettes.get(colorKey), 90, 95);
          } else {
            return ctx.isDark ? 25 : 90;
          }
        },
        adjustTone: (args) =>
          // La courbe ne vaut rien en contraste nul ou négatif ; sans passe de
          // contraste, un fond n'est pas écarté de la zone médiane non plus.
          args.context.contrastLevel > 0
            ? backgroundGapTone(
                contrastTone(
                  args.tone,
                  () => highestSurface(ctx, colors),
                  1.5,
                  args,
                ),
              )
            : args.tone,
      }),
      [onColorContainerKey]: Color.fromPalette(colorKey, {
        adjustTone: onColor(colorContainerKey, 6),
      }),
      [colorFixedKey]: Color.fromPalette(colorKey, {
        tone: () => {
          return ctx.temp({ isDark: false, contrastLevel: 0 }, () => {
            const color = this.get(colorContainerKey);
            return color.tone;
          });
        },
        adjustTone: (args) =>
          // La courbe ne vaut rien en contraste nul ou négatif ; sans passe de
          // contraste, un fond n'est pas écarté de la zone médiane non plus.
          args.context.contrastLevel > 0
            ? backgroundGapTone(
                contrastTone(
                  args.tone,
                  () => highestSurface(ctx, colors),
                  1.5,
                  args,
                ),
              )
            : args.tone,
      }),
      [colorFixedDimKey]: Color.fromPalette(colorKey, {
        tone: () => this.get(colorFixedKey).tone,
        adjustTone: applyToneDelta({
          relativeTo: colorFixedDimKey,
          delta: 5,
          polarity: 'lighter',
          constraint: 'exact',
        }),
      }),
      [onColorFixedKey]: Color.fromPalette(colorKey, {
        adjustTone: onColor(colorFixedDimKey, 7),
      }),
      [onColorFixedVariantKey]: Color.fromPalette(colorKey, {
        adjustTone: onColor(colorFixedDimKey, 4.5),
      }),
    });

    this.addColors(colors);
  }

  private rebuild(): void {
    if (this.rebuilding) return;
    this.rebuilding = true;

    try {
      this.colorManager.clear();
      this.addColors(this.context.variant.colors);
      this.customPaletteKeys.forEach((key) => this.addFromCustomPalette(key));
      this.configuredColorLayers.forEach((layer) => this.addColors(layer));
    } finally {
      this.rebuilding = false;
    }
  }
}
