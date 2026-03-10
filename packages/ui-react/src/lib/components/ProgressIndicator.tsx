import { useEffect, useState, ReactElement } from 'react';
import { ProgressIndicatorInterface } from '../interfaces/progress-indicator.interface';
import { motion } from 'motion/react';
import { useProgressIndicatorStyle } from '../styles/progress-indicator.style';
import { ReactProps } from '../utils/component';

/**
 * The ProgressIndicator component is used to display the progress of a task.
 * It can be linear or circular, and determinate or indeterminate.
 *
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
}: ReactProps<ProgressIndicatorInterface>): ReactElement => {

  // State to track the completion percentage, initialized with the prop value.
  const [completedPercentage, setCompletedPercentage] = useState(value);

  // State for the duration of the rotation in the circular animation.
  const [transitionRotate] = useState(1.5);

  // Effect to ensure the progress value remains within the 0 to 100 bounds.
  useEffect(() => {
    let clampedValue = value;

    if (clampedValue > 100) {
      clampedValue = 100;
    }

    if (clampedValue < 0) {
      clampedValue = 0;
    }

    setCompletedPercentage(clampedValue);
  }, [value]);

  // State to toggle the animation in indeterminate variants.
  const [togglePercentage, setTogglePercentage] = useState(true);

  // Function to get the rotation transition duration.
  const getTransitionRotate = () => togglePercentage ? transitionRotate : transitionRotate * 0.5;
  // Effect to handle the animation of indeterminate indicators.
  useEffect(() => {
    if (
      (variant === 'circular-indeterminate' ||
        variant === 'linear-indeterminate') &&
      completedPercentage !== 100
    ) {
      const interval = setInterval(() => {
        setCompletedPercentage(togglePercentage ? 10 : 90);
        setTogglePercentage(!togglePercentage);
      }, getTransitionRotate() * 1000);

      return () => clearInterval(interval);
    }
    return;
  }, [variant, togglePercentage, completedPercentage]);

  // State to control the visibility of the component.
  const [isVisible, setIsVisible] = useState(false);

  // Effect to hide the component after it reaches 100%.
  useEffect(() => {
    if (completedPercentage >= 100) {
      const timeoutId = setTimeout(() => setIsVisible(false), transitionDuration);

      return () => clearTimeout(timeoutId);
    } else {
      setIsVisible(true);
    }
    return;
  }, [completedPercentage, transitionDuration]);

  // Applying styles using a custom style hook.
  const styles = useProgressIndicatorStyle({
    className,
    completed,
    variant,
    value,
    transitionDuration,
    isVisible,
  });

  return (
    <>
      {/* Render for linear variants (determinate and indeterminate) */}
      {(variant === 'linear-determinate' ||
        variant == 'linear-indeterminate') && (
        <div className={styles.progressIndicator} {...restProps}>
          {/* Main progress bar */}
          <div
            style={{
              width: `${completedPercentage}%`,
              transition: `width ${transitionDuration}ms ease-in-out ${completedPercentage == 100 ? ', max-height 200ms 0.5s ease-in-out' : ''}`,
            }}
            className={styles.track}
          ></div>
          {/* Active indicator (for indeterminate animation) */}
          <div
            style={{
              marginLeft: completedPercentage != 100 ? '6px' : '0px',
              transition: `width ${transitionDuration}ms ease-in-out ${completedPercentage == 100 ? `, max-height 200ms 0.5s ease-in-out, margin-left ${transitionDuration}ms ${transitionDuration / 1.5}ms` : ''}`,
            }}
            className={styles.activeIndicator}
          ></div>
          {/* Stop element */}
          <div
            style={{
              width: `4 px`,
              transition: `width ${transitionDuration}ms ease-in-out, max-height 200ms 0.5s ease-in-out`,
            }}
            className={styles.stop}
          ></div>
        </div>
      )}
      {/* Render for circular variants (determinate and indeterminate) */}
      {(variant === 'circular-determinate' ||
        variant == 'circular-indeterminate') && (
        <motion.svg
          key={togglePercentage + ''}
          width="48"
          height="48"
          viewBox="0 0 48 48"
          initial={{ rotate: -90 }}
          animate={{ rotate: 270 }}
          transition={{
            repeat: Infinity,
            duration: getTransitionRotate(),
            ease: 'linear',
          }}
          className={styles.progressIndicator}
          {...(restProps as any)}
        >
          {/* Animated progress circle */}
          <motion.circle
            cx="50%"
            cy="50%"
            r={isVisible ? 'calc(50% - 2px)' : '50%'}
            style={{
              strokeLinecap: 'round',
            }}
            initial="hidden"
            animate="visible"
            className={styles.activeIndicator}
            variants={{
              hidden: {
                pathLength: togglePercentage ? 10 / 100 : 90 / 100,
              },
              visible: {
                pathLength: togglePercentage ? 90 / 100 : 10 / 100,
              },
            }}
            transition={{
              pathLength: {
                type: 'tween',
                ease: 'linear',
                duration: getTransitionRotate(),
                bounce: 0,
              },
            }}
          />
        </motion.svg>
      )}
    </>
  );
};
