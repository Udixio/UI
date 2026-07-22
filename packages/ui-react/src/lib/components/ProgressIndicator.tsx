import { useEffect, useRef, useState } from 'react';
import {
  type ProgressIndicatorInterface,
  progressIndicatorStyle,
  type ReactProps,
} from '@udixio/core';

import { motion } from 'motion/react';
import { createCircularProgressController } from '@udixio/core/dom';
import { createUseStyle } from '../utils/create-use-style';

export type ReactProgressIndicatorProps =
  ReactProps<ProgressIndicatorInterface>;

export const useProgressIndicatorStyle = createUseStyle(progressIndicatorStyle);

/**
 * @status beta
 * @category Communication
 * @devx
 * - `value` is clamped to 0–100; indeterminate variants ignore it.
 * @a11y
 * - Missing `role="progressbar"` and aria-* attributes.
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
  const [completedPercentage, setCompletedPercentage] = useState(value);
  const indeterminateSvgRef = useRef<SVGSVGElement>(null);
  const indeterminateCircleRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    if (value > 100) {
      value = 100;
    }
    if (value < 0) {
      value = 0;
    }
    setCompletedPercentage(value);
  }, [value]);

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (completedPercentage >= 100) {
      const timeoutId = setTimeout(() => {
        setIsVisible(false);
      }, transitionDuration);
      return () => {
        clearTimeout(timeoutId);
      };
    } else {
      setIsVisible(true);
    }
    return;
  }, [completedPercentage, transitionDuration]);

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

  const styles = useProgressIndicatorStyle({
    className,
    variant,
    value,
    transitionDuration,
    minHeight,
    isVisible,
  });

  return (
    <>
      {variant === 'linear-indeterminate' && (
        <div className={styles.progressIndicator} {...restProps}>
          <motion.div
            animate={{
              width: ['0%', '0%', '0%', '20%'],
              marginLeft: ['0px', '0px', '6px', '6px'],
              marginRight: ['0px', '0px', '6px', '6px'],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
              times: [0, 0.499, 0.5, 1],
            }}
            style={{ flexShrink: 0 }}
            className={styles.activeIndicator}
          />
          <motion.div
            animate={{ width: ['0%', '40%', '100%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ flexShrink: 0 }}
            className={styles.firstTrack}
          />
          <motion.div
            animate={{ width: ['20%', '60%', '20%'] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
              times: [0, 0.5, 1],
            }}
            style={{ flexShrink: 0, marginLeft: '6px' }}
            className={styles.activeIndicator}
          />
          <div style={{ marginLeft: '6px' }} className={styles.lastTrack} />
        </div>
      )}
      {variant === 'linear-determinate' && (
        <div className={styles.progressIndicator} {...restProps}>
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
        <motion.svg
          key="static"
          width="48"
          height="48"
          viewBox="0 0 48 48"
          initial={{ rotate: -90 }}
          animate={{ rotate: -90 }}
          transition={{ duration: transitionDuration / 1000 }}
          className={styles.progressIndicator}
          {...(restProps as any)}
        >
          <motion.circle
            cx="50%"
            cy="50%"
            r={isVisible ? 'calc(50% - 2px)' : '50%'}
            style={{
              strokeLinecap: 'round',
            }}
            initial="determinate"
            animate="determinate"
            className={styles.activeIndicator}
            variants={{
              determinate: {
                pathLength: completedPercentage / 100,
              },
            }}
            transition={{
              pathLength: {
                type: 'tween',
                ease: 'easeInOut',
                duration: transitionDuration / 1000,
              },
            }}
          />
        </motion.svg>
      )}
    </>
  );
};
