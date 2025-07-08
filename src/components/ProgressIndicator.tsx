import React, { useEffect, useState } from 'react';
import { ProgressIndicatorInterface } from '../interfaces/progress-indicator.interface';

import { motion } from 'motion/react';
import { progressIndicatorStyle } from '../styles/progress-indicator.style';
import { ReactProps } from '../utils/component';

export const ProgressIndicator = ({
  variant = 'linear-determinate',
  minHeight = 4,
  value = 0,
  transitionDuration = 1000,
  className,
  ...restProps
}: ReactProps<ProgressIndicatorInterface>): any => {
  const [completedPercentage, setCompletedPercentage] = useState(value);

  const [transitionRotate, setTransitionRotate] = useState(1.5);

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
  }, [completedPercentage, transitionDuration]);

  const styles = progressIndicatorStyle({
    className,
    variant,
    value,
    transitionDuration,
    isVisible,
    minHeight,
  });

  return (
    <>
      {(variant === 'linear-determinate' ||
        variant == 'linear-indeterminate') && (
        <div
          style={{ height: `${minHeight}px` }}
          className={styles.progressIndicator}
          {...restProps}
        >
          <div
            style={{
              height: !isVisible ? '0px' : `${minHeight}px`,
              width: `${completedPercentage}%`,
              transition: `width ${1}ms ease-in-out ${completedPercentage == 100 ? ', height 200ms 0.5s ease-in-out' : ''}`,
            }}
            className={styles.track}
          ></div>
          <div
            style={{
              height: !isVisible ? '0px' : `${minHeight}px`,
              marginLeft: completedPercentage != 100 ? '6px' : '0px',
              transition: `width ${transitionDuration}ms ease-in-out ${completedPercentage == 100 ? `, height 200ms 0.5s ease-in-out, margin-left ${transitionDuration}ms ${transitionDuration / 1.5}ms` : ''}`,
            }}
            className={styles.activeIndicator}
          ></div>
          <div
            style={{
              height: !isVisible ? '0px' : `${minHeight}px`,
              width: `${minHeight}px`,
              transition: `width ${transitionDuration}ms ease-in-out, height 200ms 0.5s ease-in-out`,
            }}
            className={styles.stop}
          ></div>
        </div>
      )}
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
