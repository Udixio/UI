import { useEffect, useRef, useState } from 'react';
import {
  clampProgressValue,
  isDeterminateVariant,
  type ProgressIndicatorInterface,
  progressIndicatorStyle,
  type ReactProps,
} from '@udixio/core';

import {
  createCircularProgressController,
  createLinearIndeterminateController,
  createProgressVisibilityController,
} from '@udixio/core/dom';
import { createUseStyle } from '../utils/create-use-style';

export type ReactProgressIndicatorProps =
  ReactProps<ProgressIndicatorInterface>;

export const useProgressIndicatorStyle = createUseStyle(progressIndicatorStyle);

/**
 * Progress indicators express an unspecified wait time or display the length
 * of a process.
 *
 * @status beta
 * @category Communication
 * @devx
 * - `value` is clamped to 0–100; indeterminate variants ignore it.
 * @a11y
 * - Renders `role="progressbar"` with `aria-valuemin`/`aria-valuemax`; determinate
 *   variants also expose `aria-valuenow`.
 * - Provide `aria-label` or `aria-labelledby`; this component does not infer an
 *   accessible name.
 * @limitations
 * - Visibility auto-hides at 100% (no controlled open prop).
 */
export const ProgressIndicator = ({
  variant = 'linear-determinate',
  value = 0,
  transitionDuration = 1000,
  minHeight,
  className,
  ...restProps
}: ReactProgressIndicatorProps): any => {
  const completedPercentage = clampProgressValue(value);
  const indeterminateSvgRef = useRef<SVGSVGElement>(null);
  const indeterminateCircleRef = useRef<SVGCircleElement>(null);
  const leadingBarRef = useRef<HTMLDivElement>(null);
  const gapTrackRef = useRef<HTMLDivElement>(null);
  const trailingBarRef = useRef<HTMLDivElement>(null);

  const [isVisible, setIsVisible] = useState(() => completedPercentage < 100);

  useEffect(
    () =>
      createProgressVisibilityController({
        completedPercentage,
        transitionDuration,
        onVisibilityChange: setIsVisible,
      }),
    [completedPercentage, transitionDuration],
  );

  useEffect(() => {
    if (
      variant !== 'circular-indeterminate' ||
      !indeterminateSvgRef.current ||
      !indeterminateCircleRef.current
    ) {
      return;
    }

    return createCircularProgressController({
      svg: indeterminateSvgRef.current,
      circle: indeterminateCircleRef.current,
    });
  }, [variant]);

  useEffect(() => {
    if (
      variant !== 'linear-indeterminate' ||
      !leadingBarRef.current ||
      !gapTrackRef.current ||
      !trailingBarRef.current
    ) {
      return;
    }

    return createLinearIndeterminateController({
      leadingBar: leadingBarRef.current,
      gapTrack: gapTrackRef.current,
      trailingBar: trailingBarRef.current,
    });
  }, [variant]);

  const styles = useProgressIndicatorStyle({
    className,
    variant,
    value,
    transitionDuration,
    minHeight,
    isVisible,
  });

  const circularRadius = isVisible ? 22 : 24;
  const circumference = 2 * Math.PI * circularRadius;
  const strokeDashoffset = circumference * (1 - completedPercentage / 100);

  const progressBarProps = {
    role: 'progressbar' as const,
    'aria-valuemin': 0,
    'aria-valuemax': 100,
    'aria-valuenow': isDeterminateVariant(variant)
      ? completedPercentage
      : undefined,
  };

  return (
    <>
      {variant === 'linear-indeterminate' && (
        <div
          className={styles.progressIndicator}
          {...progressBarProps}
          {...restProps}
        >
          <div
            ref={leadingBarRef}
            style={{ flexShrink: 0 }}
            className={styles.activeIndicator}
          />
          <div
            ref={gapTrackRef}
            style={{ flexShrink: 0 }}
            className={styles.firstTrack}
          />
          <div
            ref={trailingBarRef}
            style={{ flexShrink: 0, marginLeft: '6px' }}
            className={styles.activeIndicator}
          />
          <div style={{ marginLeft: '6px' }} className={styles.lastTrack} />
        </div>
      )}
      {variant === 'linear-determinate' && (
        <div
          className={styles.progressIndicator}
          {...progressBarProps}
          {...restProps}
        >
          <div
            style={{
              width: `${completedPercentage}%`,
              transition: `width ${transitionDuration}ms ease-in-out ${completedPercentage == 100 ? ', max-height 200ms 0.5s ease-in-out' : ''}`,
            }}
            className={styles.activeIndicator}
          ></div>
          <div
            style={{
              marginLeft: completedPercentage != 100 ? '6px' : '0px',
              transition: `width ${transitionDuration}ms ease-in-out ${completedPercentage == 100 ? `, max-height 200ms 0.5s ease-in-out, margin-left ${transitionDuration}ms ${transitionDuration / 1.5}ms` : ''}`,
            }}
            className={styles.lastTrack}
          ></div>
          <div
            style={{
              width: `4px`,
              transition: `width ${transitionDuration}ms ease-in-out, max-height 200ms 0.5s ease-in-out`,
            }}
            className={styles.stop}
          ></div>
        </div>
      )}
      {variant === 'circular-indeterminate' && (
        <svg
          ref={indeterminateSvgRef}
          width="48"
          height="48"
          viewBox="0 0 48 48"
          className={styles.progressIndicator}
          {...progressBarProps}
          {...(restProps as any)}
        >
          <circle
            ref={indeterminateCircleRef}
            cx="50%"
            cy="50%"
            r="calc(50% - 2px)"
            style={{ strokeLinecap: 'round' }}
            className={styles.activeIndicator}
          />
        </svg>
      )}
      {variant === 'circular-determinate' && (
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          style={{ transform: 'rotate(-90deg)' }}
          className={styles.progressIndicator}
          {...progressBarProps}
          {...(restProps as any)}
        >
          <circle
            cx="50%"
            cy="50%"
            r={circularRadius}
            style={{
              strokeLinecap: 'round',
              strokeDasharray: circumference,
              strokeDashoffset,
              transition: `stroke-dashoffset ${transitionDuration}ms ease-in-out`,
            }}
            className={styles.activeIndicator}
          />
        </svg>
      )}
    </>
  );
};
