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

import { Contrast } from '@material/material-color-utilities';

/**
 * Tone math shared by the contrast adjusters.
 *
 * Upstream this was a full dynamic-color class parameterised by a `Scheme`.
 * That role now belongs to `Color`, which resolves its own tone from the API,
 * so only the scheme-independent statics survive here.
 */
export class DynamicColor {
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
}
