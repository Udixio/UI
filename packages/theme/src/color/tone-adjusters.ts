import { clampDouble, Contrast } from '@material/material-color-utilities';
import { ContrastCurve, DynamicColor } from '../material-color-utilities';
import { getCurve, StandardContrastRatio } from './color.utils';
import type { API } from '../API';
import type { Context } from '../context';
import type { Palette } from '../palette/palette';
import type { Color } from './color.base';
import type { ColorApi } from './color.api';
import type { PaletteApi } from '../palette/palette.api';

/**
 * Band of tones a background color must avoid: between `darkCeiling` and
 * `lightFloor`, no foreground — light or dark — reaches sufficient contrast.
 * A tone that falls inside it is pushed to the nearest edge, switching sides
 * at `pivot`.
 *
 * These values come from the Material specification; changing them takes the
 * theme out of compliance.
 */
export const BACKGROUND_TONE_GAP = {
  /** Above, push toward light; below, toward dark. */
  pivot: 57,
  /** Minimum tone on the light side. */
  lightFloor: 65,
  /** Maximum tone on the dark side. */
  darkCeiling: 49,
} as const;

/** Tone of a color that has neither an explicit tone nor an adjuster. */
export const DEFAULT_TONE = 50;

/**
 * Adjusts the tone of a color.
 *
 * Minimal context received by an adjuster at resolution time.
 *
 * The full API is not exposed: tone adjusters only need the current tone, the
 * theme context and the color and palette registries.
 */
export type ToneAdjusterArgs = {
  /** Tone left by the previous step of the chain. */
  tone: number;
  /** Dynamic theme state: dark mode, contrast, variant, etc. */
  context: Context;
  /** Registry of the current theme's resolved colors. */
  colors: ColorApi;
  /** Registry of the current theme's resolved palettes. */
  palettes: PaletteApi;
};

/** An adjuster receives the minimal context and returns the next tone. */
export type ToneAdjuster = (args: ToneAdjusterArgs) => number;

/**
 * A color, referenced by its key, directly, or through a deferred resolution.
 * The callback is evaluated at adjustment time and may close over the context
 * in which the color was declared.
 */
export type ColorRef = string | Color | (() => Color);

/** A palette, referenced by its key in the registry or directly. */
export type PaletteRef = string | Palette | ((api: API) => Palette);

/**
 * The target contrast: a standard ratio, a custom curve, or a zero-argument
 * function when it depends on the context.
 */
export type ContrastSpec =
  StandardContrastRatio | ContrastCurve | (() => ContrastCurve | undefined);

/** Direction of the delta, described **from the color that declares it**. */
export type TonePolarity =
  'darker' | 'lighter' | 'relativeDarker' | 'relativeLighter';

/** How to satisfy the delta constraint. */
export type DeltaConstraint = 'exact' | 'nearer' | 'farther';

export type ToneDelta = {
  /** The other color of the pair, whose tone is already resolved. */
  relativeTo: ColorRef;
  /** Required delta, as an absolute value. */
  delta: number;
  polarity: TonePolarity;
  /** `exact` pins the tone; `nearer` and `farther` bound it. */
  constraint: DeltaConstraint;
};

function resolveColor(ref: ColorRef, args: ToneAdjusterArgs): Color {
  if (typeof ref === 'string') return args.colors.get(ref);
  if (typeof ref === 'function') return ref();
  return ref;
}

export function resolvePalette(ref: PaletteRef, api: API): Palette {
  if (typeof ref === 'string') return api.palettes.get(ref);
  if (typeof ref === 'function') return ref(api);
  return ref;
}

function resolveCurve(spec: ContrastSpec): ContrastCurve | undefined {
  if (typeof spec === 'number') return getCurve(spec);
  if (typeof spec === 'function') return spec();
  return spec;
}

/**
 * The tone of a foreground placed on `background`: starts from the background
 * tone and pushes it until the target contrast is reached.
 *
 * This is the shape of the `on*` tokens. The only adjuster that **ignores the
 * incoming tone** — so it only makes sense in first position.
 */
export function onColor(
  background: ColorRef,
  contrast: ContrastSpec,
): ToneAdjuster {
  return (args) => {
    const on = resolveColor(background, args);
    return contrastTone(on.tone, on, contrast, args);
  };
}

/**
 * The core of {@link contrastAgainst} and {@link onColor}, on a bare tone.
 * Exported because it is tested and reused on its own.
 */
export function contrastTone(
  tone: number,
  background: ColorRef,
  contrast: ContrastSpec,
  args: ToneAdjusterArgs,
): number {
  const curve = resolveCurve(contrast);
  if (!curve) return tone;

  const backgroundTone = resolveColor(background, args).tone;
  const ratio = curve.get(args.context.contrastLevel);
  if (
    Contrast.ratioOfTones(backgroundTone, tone) >= ratio &&
    args.context.contrastLevel >= 0
  ) {
    return tone;
  }
  return DynamicColor.foregroundTone(backgroundTone, ratio);
}

/**
 * Pushes the incoming tone until it contrasts enough with `background`.
 *
 * The tone is left as is when it already satisfies the ratio — except under
 * negative contrast, where it is recomputed so it can be reduced. No effect if
 * the contrast resolves to `undefined`.
 */
export function contrastAgainst(
  background: ColorRef,
  contrast: ContrastSpec,
): ToneAdjuster {
  return (args) => contrastTone(args.tone, background, contrast, args);
}

/**
 * Moves the tone out of the band where no foreground gets sufficient
 * contrast. Only for colors that serve as backgrounds — and never after an
 * `exact` delta, which it would break.
 */
export function avoidBackgroundGap(): ToneAdjuster {
  return ({ tone }) => backgroundGapTone(tone);
}

/**
 * The core of {@link avoidBackgroundGap}, on a bare tone. Exported for colors
 * whose clamp is conditional and that compose it by hand.
 */
export function backgroundGapTone(tone: number): number {
  const { pivot, lightFloor, darkCeiling } = BACKGROUND_TONE_GAP;
  return tone >= pivot
    ? clampDouble(lightFloor, 100, tone)
    : clampDouble(0, darkCeiling, tone);
}

/** Enforces a tone delta relative to another color. */
export function applyToneDelta({
  relativeTo,
  delta,
  polarity,
  constraint,
}: ToneDelta): ToneAdjuster {
  return (args) => {
    const { tone, context } = args;
    const signed =
      polarity === 'darker' ||
      (polarity === 'relativeLighter' && context.isDark) ||
      (polarity === 'relativeDarker' && !context.isDark)
        ? -delta
        : delta;

    const reference = resolveColor(relativeTo, args).tone;

    if (constraint === 'exact') {
      return clampDouble(0, 100, reference + signed);
    }
    if (constraint === 'nearer') {
      return signed > 0
        ? clampDouble(0, 100, clampDouble(reference, reference + signed, tone))
        : clampDouble(0, 100, clampDouble(reference + signed, reference, tone));
    }
    return signed > 0
      ? clampDouble(reference + signed, 100, tone)
      : clampDouble(0, reference + signed, tone);
  };
}

/**
 * Looks for a tone that contrasts enough with two backgrounds at once. Leaves
 * the tone unchanged when it already satisfies both.
 */
export function arbitrateBackgrounds(
  first: ColorRef,
  second: ColorRef,
  contrast: ContrastSpec,
): ToneAdjuster {
  return (args) => {
    const { tone, context } = args;
    const curve = resolveCurve(contrast);
    if (!curve) return tone;

    const ratio = curve.get(context.contrastLevel);
    const toneA = resolveColor(first, args).tone;
    const toneB = resolveColor(second, args).tone;
    const [upper, lower] = [Math.max(toneA, toneB), Math.min(toneA, toneB)];

    if (
      Contrast.ratioOfTones(upper, tone) >= ratio &&
      Contrast.ratioOfTones(lower, tone) >= ratio
    ) {
      return tone;
    }

    // The darkest light tone that satisfies the ratio, or -1.
    const lightOption = Contrast.lighter(upper, ratio);
    // The lightest dark tone that satisfies the ratio, or -1.
    const darkOption = Contrast.darker(lower, ratio);

    const prefersLight =
      DynamicColor.tonePrefersLightForeground(toneA) ||
      DynamicColor.tonePrefersLightForeground(toneB);
    if (prefersLight) {
      return lightOption < 0 ? 100 : lightOption;
    }

    const availables = [];
    if (lightOption !== -1) availables.push(lightOption);
    if (darkOption !== -1) availables.push(darkOption);
    if (availables.length === 1) {
      return availables[0];
    }
    return darkOption < 0 ? 0 : darkOption;
  };
}
