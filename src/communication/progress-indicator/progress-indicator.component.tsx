import React, { useEffect, useState } from 'react';
import {
  ProgressIndicatorDefaultProps,
  ProgressIndicatorElement,
  ProgressIndicatorExternalProps,
  ProgressIndicatorInternalState,
  ProgressIndicatorProps,
} from './progress-indicator.interface';
import { ProgressIndicatorStyle } from './progress-indicator.style';
import { motion } from 'framer-motion';
import { StylesHelper } from '../../utils';

export const ProgressIndicator = ({
  variant = 'linear-determinate',
  minHeight = 4,
  value = 0,
  transitionDuration = 1000,
  className,
}: ProgressIndicatorProps) => {
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

  const classNames = StylesHelper.classNamesElements<
    ProgressIndicatorExternalProps &
      ProgressIndicatorDefaultProps &
      ProgressIndicatorInternalState,
    ProgressIndicatorElement
  >({
    default: 'progressIndicator',
    classNameList: [className, ProgressIndicatorStyle],
    states: {
      variant,
      value,
      transitionDuration,
      isVisible,
      minHeight,
    },
  });

  return (
    <>
      {(variant === 'linear-determinate' ||
        variant == 'linear-indeterminate') && (
        <div
          style={{ height: `${minHeight}px` }}
          className={classNames.progressIndicator}
        >
          <div
            style={{
              height: !isVisible ? '0px' : `${minHeight}px`,
              width: `${completedPercentage}%`,
              transition: `width ${1}ms ease-in-out ${completedPercentage == 100 ? ', height 200ms 0.5s ease-in-out' : ''}`,
            }}
            className={classNames.track}
          ></div>
          <div
            style={{
              height: !isVisible ? '0px' : `${minHeight}px`,
              marginLeft: completedPercentage != 100 ? '6px' : '0px',
              transition: `width ${transitionDuration}ms ease-in-out ${completedPercentage == 100 ? `, height 200ms 0.5s ease-in-out, margin-left ${transitionDuration}ms ${transitionDuration / 1.5}ms` : ''}`,
            }}
            className={classNames.activeIndicator}
          ></div>
          <div
            style={{
              height: !isVisible ? '0px' : `${minHeight}px`,
              width: `${minHeight}px`,
              transition: `width ${transitionDuration}ms ease-in-out, height 200ms 0.5s ease-in-out`,
            }}
            className={classNames.stop}
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
          className={classNames.progressIndicator}
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
            className={classNames.activeIndicator}
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
