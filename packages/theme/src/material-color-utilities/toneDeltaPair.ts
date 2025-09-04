/**
 * @license
 * Copyright 2023 Google LLC
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

import { AdjustTone, DynamicColor } from './dynamic_color';
import { clampDouble, Contrast } from '@material/material-color-utilities';
import { Scheme } from '../theme';

/**
 * Describes the different in tone between colors.
 *
 * nearer and farther are deprecated. Use DeltaConstraint instead.
 */
export type TonePolarity =
  | 'darker'
  | 'lighter'
  | 'nearer'
  | 'farther'
  | 'relative_darker'
  | 'relative_lighter';

/**
 * Describes how to fulfill a tone delta pair constraint.
 */
export type DeltaConstraint = 'exact' | 'nearer' | 'farther';

/**
 * Documents a constraint between two DynamicColors, in which their tones must
 * have a certain distance from each other.
 *
 * Prefer a DynamicColor with a background, this is for special cases when
 * designers want tonal distance, literally contrast, between two colors that
 * don't have a background / foreground relationship or a contrast guarantee.
 */
class ToneDeltaPair {
  /**
   * Documents a constraint in tone distance between two DynamicColors.
   *
   * The polarity is an adjective that describes "A", compared to "B".
   *
   * For instance, ToneDeltaPair(A, B, 15, 'darker', 'exact') states that
   * A's tone should be exactly 15 darker than B's.
   *
   * 'relative_darker' and 'relative_lighter' describes the tone adjustment
   * relative to the surface color trend (white in light mode; black in dark
   * mode). For instance, ToneDeltaPair(A, B, 10, 'relative_lighter',
   * 'farther') states that A should be at least 10 lighter than B in light
   * mode, and at least 10 darker than B in dark mode.
   *
   * @param roleA The first role in a pair.
   * @param roleB The second role in a pair.
   * @param delta Required difference between tones. Absolute value, negative
   * values have undefined behavior.
   * @param polarity The relative relation between tones of roleA and roleB,
   * as described above.
   * @param constraint How to fulfill the tone delta pair constraint.
   * @param stayTogether Whether these two roles should stay on the same side
   * of the "awkward zone" (T50-59). This is necessary for certain cases where
   * one role has two backgrounds.
   */
  constructor(
    readonly roleA: DynamicColor,
    readonly roleB: DynamicColor,
    readonly delta: number,
    readonly polarity: TonePolarity,
    readonly stayTogether: boolean,
    readonly constraint?: DeltaConstraint,
  ) {
    this.constraint = constraint ?? 'exact';
  }

  adjustedTone({
    scheme,
    dynamicColor,
  }: {
    scheme: Scheme;
    dynamicColor: DynamicColor;
  }) {
    const roleA = this.roleA;
    const roleB = this.roleB;
    const polarity = this.polarity;
    const constraint = this.constraint;
    const absoluteDelta =
      polarity === 'darker' ||
      (polarity === 'relative_lighter' && scheme.isDark) ||
      (polarity === 'relative_darker' && !scheme.isDark)
        ? -this.delta
        : this.delta;

    const amRoleA = dynamicColor.name === roleA.name;
    const selfRole = amRoleA ? roleA : roleB;
    const refRole = amRoleA ? roleB : roleA;
    let selfTone = selfRole.tone(scheme);
    const refTone = refRole.getTone(scheme);
    const relativeDelta = absoluteDelta * (amRoleA ? 1 : -1);

    if (constraint === 'exact') {
      selfTone = clampDouble(0, 100, refTone + relativeDelta);
    } else if (constraint === 'nearer') {
      if (relativeDelta > 0) {
        selfTone = clampDouble(
          0,
          100,
          clampDouble(refTone, refTone + relativeDelta, selfTone),
        );
      } else {
        selfTone = clampDouble(
          0,
          100,
          clampDouble(refTone + relativeDelta, refTone, selfTone),
        );
      }
    } else if (constraint === 'farther') {
      if (relativeDelta > 0) {
        selfTone = clampDouble(refTone + relativeDelta, 100, selfTone);
      } else {
        selfTone = clampDouble(0, refTone + relativeDelta, selfTone);
      }
    }

    if (dynamicColor.background && dynamicColor.contrastCurve) {
      const background = dynamicColor.background(scheme);
      const contrastCurve = dynamicColor.contrastCurve(scheme);
      if (background && contrastCurve) {
        // Adjust the tones for contrast, if background and contrast curve
        // are defined.
        const bgTone = background.getTone(scheme);
        const selfContrast = contrastCurve.get(scheme.contrastLevel);
        selfTone =
          Contrast.ratioOfTones(bgTone, selfTone) >= selfContrast &&
          scheme.contrastLevel >= 0
            ? selfTone
            : DynamicColor.foregroundTone(bgTone, selfContrast);
      }
    }

    // This can avoid the awkward tones for background colors including the
    // access fixed colors. Accent fixed dim colors should not be adjusted.
    if (
      dynamicColor.isBackground &&
      !dynamicColor.name.endsWith('_fixed_dim')
    ) {
      if (selfTone >= 57) {
        selfTone = clampDouble(65, 100, selfTone);
      } else {
        selfTone = clampDouble(0, 49, selfTone);
      }
    }

    return selfTone;
  }
}

export const toneDeltaPair = (
  ...params: ConstructorParameters<typeof ToneDeltaPair>
): AdjustTone => {
  return (args) => new ToneDeltaPair(...params).adjustedTone(args);
};
