import {
  argbFromHex,
  clampDouble,
  Contrast,
  hexFromArgb,
  TonalPalette,
} from '@material/material-color-utilities';
import { Scheme, SchemeManager } from '../theme';
import { ContrastCurve, DynamicColor } from '../material-color-utilities';
import { Hct } from '../material-color-utilities/htc';
import { ColorManager } from './color.manager';

export type ColorOptions =
  | FromPaletteOptions
  | {
      hex: string;
    }
  | {
      alias: string;
    };

function argbToRgb(argb: number): { r: number; g: number; b: number } {
  return {
    r: (argb >> 16) & 0xff,
    g: (argb >> 8) & 0xff,
    b: argb & 0xff,
  };
}

export function getInitialToneFromBackground(
  background?: () => Color | undefined,
): number {
  if (background === undefined) {
    return 50;
  }
  return background() ? background()!.getTone() : 50;
}

export abstract class Color {
  abstract getHct(): Hct;

  protected constructor(public readonly name: string) {}

  getHex(): string {
    return hexFromArgb(this.getArgb());
  }

  getArgb() {
    return this.getHct().toInt();
  }

  getRgb() {
    return argbToRgb(this.getArgb());
  }
  getTone(): number {
    return this.getHct().tone;
  }
}

export class ColorAlias extends Color {
  getHct(): Hct {
    return this.colorService.get(this.as).getHct();
  }

  constructor(
    name: string,
    public as: string,
    public colorService: ColorManager,
  ) {
    super(name);
  }
}

export class ColorFromHex extends Color {
  getHct(): Hct {
    return Hct.fromInt(argbFromHex(this.getHex()));
  }

  override getHex(): string {
    return this._hex;
  }

  setHex(hex: string) {
    this._hex = hex;
  }

  constructor(
    name: string,
    private _hex: string,
  ) {
    super(name);
    this._hex = _hex;
  }
}

/**
 * @param name The name of the dynamic color. Defaults to empty.
 * @param palette Function that provides a TonalPalette given DynamicScheme. A
 *     TonalPalette is defined by a hue and chroma, so this replaces the need to
 *     specify hue/chroma. By providing a tonal palette, when contrast
 *     adjustments are made, intended chroma can be preserved.
 * @param tone Function that provides a tone given DynamicScheme. When not
 *     provided, the tone is same as the background tone or 50, when no
 *     background is provided.
 * @param chromaMultiplier A factor that multiplies the chroma for this color.
 *     Default to 1.
 * @param isBackground Whether this dynamic color is a background, with some
 *     other color as the foreground. Defaults to false.
 * @param background The background of the dynamic color (as a function of a
 *     `DynamicScheme`), if it exists.
 * @param secondBackground A second background of the dynamic color (as a
 *     function of a `DynamicScheme`), if it exists.
 * @param contrastCurve A `ContrastCurve` object specifying how its contrast
 *     against its background should behave in various contrast levels options.
 *     Must used together with `background`. When not provided or resolved as
 *     undefined, the contrast curve is calculated based on other constraints.
 * @param adjustTone A `AdjustTone` object specifying a tone delta
 *     constraint between two colors. One of them must be the color being
 *     constructed. When not provided or resolved as undefined, the tone is
 *     calculated based on other constraints.
 */
export interface FromPaletteOptions {
  palette: () => TonalPalette;
  tone?: () => number;
  chromaMultiplier?: () => number;
  isBackground?: boolean;
  background?: () => Color | undefined;
  secondBackground?: () => Color | undefined;
  contrastCurve?: () => ContrastCurve | undefined;
  adjustTone?: () => AdjustTone | undefined;
}

export type AdjustTone = (args: { scheme: Scheme; color: Color }) => number;

export class ColorFromPalette extends Color {
  public option: FromPaletteOptions & {
    tone: () => number;
  };
  constructor(
    name: string,
    option: FromPaletteOptions,
    private schemeService: SchemeManager,
  ) {
    super(name);
    this.option = {
      ...option,
      tone:
        option.tone ?? (() => getInitialToneFromBackground(option.background)),
    };
    this.validateOption();
  }

  update(args: Partial<ColorOptions>) {
    this.option = { ...this.option, ...args };
    this.validateOption();
  }

  validateOption() {
    const option = this.option;
    if ('palette' in option) {
      if (!option.background && option.secondBackground) {
        throw new Error(
          `Color ${this.name} has secondBackground ` +
            `defined, but background is not defined.`,
        );
      }
      if (!option.background && option.contrastCurve) {
        throw new Error(
          `Color ${this.name} has contrastCurve ` +
            `defined, but background is not defined.`,
        );
      }
      if (option.background && !option.contrastCurve) {
        throw new Error(
          `Color ${this.name} has background ` +
            `defined, but contrastCurve is not defined.`,
        );
      }
    }
  }

  getHct(): Hct {
    const option = this.option;

    const palette = option.palette();
    const tone = this.getTone();
    const hue = palette.hue;
    const chroma =
      palette.chroma *
      (option.chromaMultiplier ? option.chromaMultiplier() : 1);
    return Hct.from(hue, chroma, tone);
  }

  override getTone(scheme = this.schemeService.get()): number {
    const adjustTone = this.option.adjustTone
      ? this.option.adjustTone()
      : undefined;

    // Case 0: tone delta constraint.
    if (adjustTone) {
      return adjustTone({ scheme, color: this });
    } else {
      // Case 1: No tone delta pair; just solve for itself.
      let answer = this.option.tone();
      if (
        this.option.background == undefined ||
        this.option.background() === undefined ||
        this.option.contrastCurve == undefined ||
        this.option.contrastCurve() === undefined
      ) {
        return answer; // No adjustment for colors with no background.
      }
      const bgTone = this.option.background()!.getTone();
      const desiredRatio = this.option
        .contrastCurve()!
        .get(scheme.contrastLevel);
      // Recalculate the tone from desired contrast ratio if the current
      // contrast ratio is not enough or desired contrast level is decreasing
      // (<0).
      answer =
        Contrast.ratioOfTones(bgTone, answer) >= desiredRatio &&
        scheme.contrastLevel >= 0
          ? answer
          : DynamicColor.foregroundTone(bgTone, desiredRatio);
      // This can avoid the awkward tones for background colors including the
      // access fixed colors. Accent fixed dim colors should not be adjusted.
      if (this.option.isBackground && !this.name.endsWith('_fixed_dim')) {
        if (answer >= 57) {
          answer = clampDouble(65, 100, answer);
        } else {
          answer = clampDouble(0, 49, answer);
        }
      }
      if (
        this.option.secondBackground == undefined ||
        this.option.secondBackground() === undefined
      ) {
        return answer;
      }
      // Case 2: Adjust for dual backgrounds.
      const [bg1, bg2] = [this.option.background, this.option.secondBackground];
      const [bgTone1, bgTone2] = [bg1()!.getTone(), bg2()!.getTone()];
      const [upper, lower] = [
        Math.max(bgTone1, bgTone2),
        Math.min(bgTone1, bgTone2),
      ];
      if (
        Contrast.ratioOfTones(upper, answer) >= desiredRatio &&
        Contrast.ratioOfTones(lower, answer) >= desiredRatio
      ) {
        return answer;
      }
      // The darkest light tone that satisfies the desired ratio,
      // or -1 if such ratio cannot be reached.
      const lightOption = Contrast.lighter(upper, desiredRatio);

      // The lightest dark tone that satisfies the desired ratio,
      // or -1 if such ratio cannot be reached.
      const darkOption = Contrast.darker(lower, desiredRatio);
      // Tones suitable for the foreground.
      const availables = [];
      if (lightOption !== -1) availables.push(lightOption);
      if (darkOption !== -1) availables.push(darkOption);

      const prefersLight =
        DynamicColor.tonePrefersLightForeground(bgTone1) ||
        DynamicColor.tonePrefersLightForeground(bgTone2);
      if (prefersLight) {
        return lightOption < 0 ? 100 : lightOption;
      }
      if (availables.length === 1) {
        return availables[0];
      }
      return darkOption < 0 ? 0 : darkOption;
    }
  }
}
