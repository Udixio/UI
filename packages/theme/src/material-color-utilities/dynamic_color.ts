/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  clampDouble,
  Contrast,
  TonalPalette,
} from '@material/material-color-utilities';
import { ContrastCurve } from './contrastCurve';
import { Scheme } from '../theme/scheme';
import { Hct } from './htc';

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
// export interface FromPaletteOptions {
//   name?: string;
//   palette: (scheme: Scheme) => TonalPalette;
//   tone?: (scheme: Scheme) => number;
//   chromaMultiplier?: (scheme: Scheme) => number;
//   isBackground?: boolean;
//   background?: (scheme: Scheme) => DynamicColor | undefined;
//   secondBackground?: (scheme: Scheme) => DynamicColor | undefined;
//   contrastCurve?: (scheme: Scheme) => ContrastCurve | undefined;
//   adjustTone?: (scheme: Scheme) => AdjustTone | undefined;
// }

// export type AdjustTone = (args: {
//   scheme: Scheme;
//   dynamicColor: DynamicColor;
// }) => number;

/**
 * A color that adjusts itself based on UI state provided by DynamicScheme.
 *
 * Colors without backgrounds do not change tone when contrast changes. Colors
 * with backgrounds become closer to their background as contrast lowers, and
 * further when contrast increases.
 *
 * Prefer static constructors. They require either a hexcode, a palette and
 * tone, or a hue and chroma. Optionally, they can provide a background
 * DynamicColor.
 */
export class DynamicColor {
  /**
   * The base constructor for DynamicColor.
   *
   * _Strongly_ prefer using one of the convenience constructors. This class is
   * arguably too flexible to ensure it can support any scenario. Functional
   * arguments allow  overriding without risks that come with subclasses.
   *
   * For example, the default behavior of adjust tone at max contrast
   * to be at a 7.0 ratio with its background is principled and
   * matches accessibility guidance. That does not mean it's the desired
   * approach for _every_ design system, and every color pairing,
   * always, in every case.
   *
   * @param name The name of the dynamic color. Defaults to empty.
   * @param palette Function that provides a TonalPalette given DynamicScheme. A
   *     TonalPalette is defined by a hue and chroma, so this replaces the need
   *     to specify hue/chroma. By providing a tonal palette, when contrast
   *     adjustments are made, intended chroma can be preserved.
   * @param tone Function that provides a tone, given a DynamicScheme.
   * @param isBackground Whether this dynamic color is a background, with some
   *     other color as the foreground. Defaults to false.
   * @param chromaMultiplier A factor that multiplies the chroma for this color.
   * @param background The background of the dynamic color (as a function of a
   *     `DynamicScheme`), if it exists.
   * @param secondBackground A second background of the dynamic color (as a
   *     function of a `DynamicScheme`), if it exists.
   * @param contrastCurve A `ContrastCurve` object specifying how its contrast
   *     against its background should behave in various contrast levels
   *     options.
   * @param adjustTone A `AdjustTone` object specifying a tone delta
   *     constraint between two colors. One of them must be the color being
   *     constructed.
   */
  constructor(
    readonly name: string,
    readonly palette: (scheme: Scheme) => TonalPalette,
    readonly tone: (scheme: Scheme) => number,
    readonly isBackground: boolean,
    readonly chromaMultiplier?: (scheme: Scheme) => number,
    readonly background?: (scheme: Scheme) => DynamicColor | undefined,
    readonly secondBackground?: (scheme: Scheme) => DynamicColor | undefined,
    readonly contrastCurve?: (scheme: Scheme) => ContrastCurve | undefined,
    readonly adjustTone?: (scheme: Scheme) => AdjustTone | undefined,
  ) {
    if (!background && secondBackground) {
      throw new Error(
        `Color ${name} has secondBackground` +
          `defined, but background is not defined.`,
      );
    }
    if (!background && contrastCurve) {
      throw new Error(
        `Color ${name} has contrastCurve` +
          `defined, but background is not defined.`,
      );
    }
    if (background && !contrastCurve) {
      throw new Error(
        `Color ${name} has background` +
          `defined, but contrastCurve is not defined.`,
      );
    }
  }

  /**
   * Create a DynamicColor defined by a TonalPalette and HCT tone.
   *
   * @param args Functions with DynamicScheme as input. Must provide a palette
   *     and tone. May provide a background DynamicColor and ToneDeltaPair.
   */
  static fromPalette(args: FromPaletteOptions): DynamicColor {
    return new DynamicColor(
      args.name ?? '',
      args.palette,
      args.tone ??
        (() => DynamicColor.getInitialToneFromBackground(args.background)),
      args.isBackground ?? false,
      args.chromaMultiplier,
      args.background,
      args.secondBackground,
      args.contrastCurve,
      args.adjustTone,
    );
  }

  // static getInitialToneFromBackground(
  //   background?: () => Color | undefined,
  // ): number {
  //   if (background === undefined) {
  //     return 50;
  //   }
  //   return (background() ? background()!.getTone() : 50);
  // }

  /**
   * Given a background tone, finds a foreground tone, while ensuring they reach
   * a contrast ratio that is as close to [ratio] as possible.
   *
   * @param bgTone Tone in HCT. Range is 0 to 100, undefined behavior when it
   *     falls outside that range.
   * @param ratio The contrast ratio desired between bgTone and the return
   *     value.
   */
  static foregroundTone(bgTone: number, ratio: number): number {
    const lighterTone = Contrast.lighterUnsafe(bgTone, ratio);
    const darkerTone = Contrast.darkerUnsafe(bgTone, ratio);
    const lighterRatio = Contrast.ratioOfTones(lighterTone, bgTone);
    const darkerRatio = Contrast.ratioOfTones(darkerTone, bgTone);
    const preferLighter = DynamicColor.tonePrefersLightForeground(bgTone);

    if (preferLighter) {
      // This handles an edge case where the initial contrast ratio is high
      // (ex. 13.0), and the ratio passed to the function is that high
      // ratio, and both the lighter and darker ratio fails to pass that
      // ratio.
      //
      // This was observed with Tonal Spot's On Primary Container turning
      // black momentarily between high and max contrast in light mode. PC's
      // standard tone was T90, OPC's was T10, it was light mode, and the
      // contrast value was 0.6568521221032331.
      const negligibleDifference =
        Math.abs(lighterRatio - darkerRatio) < 0.1 &&
        lighterRatio < ratio &&
        darkerRatio < ratio;
      return lighterRatio >= ratio ||
        lighterRatio >= darkerRatio ||
        negligibleDifference
        ? lighterTone
        : darkerTone;
    } else {
      return darkerRatio >= ratio || darkerRatio >= lighterRatio
        ? darkerTone
        : lighterTone;
    }
  }

  /**
   * Returns whether [tone] prefers a light foreground.
   *
   * People prefer white foregrounds on ~T60-70. Observed over time, and also
   * by Andrew Somers during research for APCA.
   *
   * T60 used as to create the smallest discontinuity possible when skipping
   * down to T49 in order to ensure light foregrounds.
   * Since `tertiaryContainer` in dark monochrome scheme requires a tone of
   * 60, it should not be adjusted. Therefore, 60 is excluded here.
   */
  static tonePrefersLightForeground(tone: number): boolean {
    return Math.round(tone) < 60.0;
  }

  /**
   * Returns whether [tone] can reach a contrast ratio of 4.5 with a lighter
   * color.
   */
  static toneAllowsLightForeground(tone: number): boolean {
    return Math.round(tone) <= 49.0;
  }

  /**
   * Adjusts a tone such that white has 4.5 contrast, if the tone is
   * reasonably close to supporting it.
   */
  static enableLightForeground(tone: number): number {
    if (
      DynamicColor.tonePrefersLightForeground(tone) &&
      !DynamicColor.toneAllowsLightForeground(tone)
    ) {
      return 49.0;
    }
    return tone;
  }

  /**
   * Returns a deep copy of this DynamicColor.
   */
  clone(): DynamicColor {
    return DynamicColor.fromPalette({
      name: this.name,
      palette: this.palette,
      tone: this.tone,
      isBackground: this.isBackground,
      chromaMultiplier: this.chromaMultiplier,
      background: this.background,
      secondBackground: this.secondBackground,
      contrastCurve: this.contrastCurve,
      adjustTone: this.adjustTone,
    });
  }

  /**
   * Returns a ARGB integer (i.e. a hex code).
   *
   * @param scheme Defines the conditions of the user interface, for example,
   *     whether or not it is dark mode or light mode, and what the desired
   *     contrast level is.
   */
  getArgb(scheme: Scheme): number {
    return this.getHct(scheme).toInt();
  }

  /**
   * Returns a color, expressed in the HCT color space, that this
   * DynamicColor is under the conditions in scheme.
   *
   * @param scheme Defines the conditions of the user interface, for example,
   *     whether or not it is dark mode or light mode, and what the desired
   *     contrast level is.
   */
  getHct(scheme: Scheme): Hct {
    const palette = this.palette(scheme);
    const tone = this.getTone(scheme);
    const hue = palette.hue;
    const chroma =
      palette.chroma *
      (this.chromaMultiplier ? this.chromaMultiplier(scheme) : 1);

    return Hct.from(hue, chroma, tone);
  }

  /**
   * Returns a tone, T in the HCT color space, that this DynamicColor is under
   * the conditions in scheme.
   *
   * @param scheme Defines the conditions of the user interface, for example,
   *     whether or not it is dark mode or light mode, and what the desired
   *     contrast level is.
   */
  getTone(scheme: Scheme): number {
    const adjustTone = this.adjustTone ? this.adjustTone(scheme) : undefined;

    // Case 0: tone delta constraint.
    if (adjustTone) {
      return adjustTone({ scheme, dynamicColor: this });
    } else {
      // Case 1: No tone delta pair; just solve for itself.
      let answer = this.tone(scheme);

      if (
        this.background == undefined ||
        this.background(scheme) === undefined ||
        this.contrastCurve == undefined ||
        this.contrastCurve(scheme) === undefined
      ) {
        return answer; // No adjustment for colors with no background.
      }

      const bgTone = this.background(scheme)!.getTone(scheme);
      const desiredRatio = this.contrastCurve(scheme)!.get(
        scheme.contrastLevel,
      );

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
      if (this.isBackground && !this.name.endsWith('_fixed_dim')) {
        if (answer >= 57) {
          answer = clampDouble(65, 100, answer);
        } else {
          answer = clampDouble(0, 49, answer);
        }
      }

      if (
        this.secondBackground == undefined ||
        this.secondBackground(scheme) === undefined
      ) {
        return answer;
      }

      // Case 2: Adjust for dual backgrounds.
      const [bg1, bg2] = [this.background, this.secondBackground];
      const [bgTone1, bgTone2] = [
        bg1(scheme)!.getTone(scheme),
        bg2(scheme)!.getTone(scheme),
      ];
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
