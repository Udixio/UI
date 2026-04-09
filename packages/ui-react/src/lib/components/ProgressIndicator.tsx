import { useEffect, useState } from 'react';
import { ProgressIndicatorInterface } from '../interfaces/progress-indicator.interface';

import { motion } from 'motion/react';
import { useProgressIndicatorStyle } from '../styles/progress-indicator.style';
import { ReactProps } from '../utils/component';

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
  className,
  ...restProps
}: ReactProps<ProgressIndicatorInterface>): any => {
  const [completedPercentage, setCompletedPercentage] = useState(value);

  const [transitionRotate] = useState(1.5);

  useEffect(() => {
    if (value > 100) {
      value = 100;
    }
    if (value < 0) {
      value = 0;
    }
    setCompletedPercentage(value);
  }, [value]);

  const [togglePercentage, setTogglePercentage] = useState(true);

  const getTransitionRotate = () => {
    return togglePercentage ? transitionRotate : transitionRotate * 0.5;
  };

  useEffect(() => {
    if (variant === 'circular-indeterminate' && completedPercentage !== 100) {
      const interval = setInterval(() => {
        setCompletedPercentage(togglePercentage ? 20 : 40);
        setTogglePercentage(!togglePercentage);
      }, getTransitionRotate() * 1000);
      return () => clearInterval(interval);
    }
    return;
  }, [variant, togglePercentage, completedPercentage]);

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

  const styles = useProgressIndicatorStyle({
    className,
    variant,
    value,
    transitionDuration,
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
      {(variant === 'circular-determinate' ||
        variant == 'circular-indeterminate') && (
        <motion.svg
          key={
            variant === 'circular-indeterminate'
              ? togglePercentage + ''
              : 'static'
          }
          width="48"
          height="48"
          viewBox="0 0 48 48"
          initial={{ rotate: -90 }}
          animate={{ rotate: variant === 'circular-indeterminate' ? 270 : -90 }}
          transition={
            variant === 'circular-indeterminate'
              ? {
                  repeat: Infinity,
                  duration: getTransitionRotate(),
                  ease: 'linear',
                }
              : { duration: transitionDuration / 1000 }
          }
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
            initial={
              variant === 'circular-indeterminate' ? 'hidden' : 'determinate'
            }
            animate={
              variant === 'circular-indeterminate' ? 'visible' : 'determinate'
            }
            className={styles.activeIndicator}
            variants={{
              hidden: {
                pathLength: togglePercentage ? 10 / 100 : 90 / 100,
              },
              visible: {
                pathLength: togglePercentage ? 90 / 100 : 10 / 100,
              },
              determinate: {
                pathLength: completedPercentage / 100,
              },
            }}
            transition={{
              pathLength:
                variant === 'circular-indeterminate'
                  ? {
                      type: 'tween',
                      ease: 'linear',
                      duration: getTransitionRotate(),
                      bounce: 0,
                    }
                  : {
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
