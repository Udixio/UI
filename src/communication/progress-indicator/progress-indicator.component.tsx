import { StylesHelper } from '../../utils';
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

export const ProgressIndicator = ({
  variant = 'linear-determinate',
  minHeight = 4,
  value = 0,
  transitionDuration = 1000,
  className,
}: ProgressIndicatorProps) => {
  let completedPercentage = value;
  if (completedPercentage > 100) {
    completedPercentage = 100;
  }
  if (completedPercentage < 0) {
    completedPercentage = 0;
  }

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (completedPercentage >= 100) {
      const timeoutId = setTimeout(() => {
        setIsVisible(true);
      }, transitionDuration);
      return () => {
        clearTimeout(timeoutId);
      };
    } else {
      setIsVisible(false);
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
              height: isVisible ? '0px' : `${minHeight}px`,
              width: `${completedPercentage}%`,
              transition: `width ${transitionDuration}ms ease-in-out ${completedPercentage == 100 ? ', height 200ms 0.5s ease-in-out' : ''}`,
            }}
            className={classNames.track}
          ></div>
          <div
            style={{
              height: isVisible ? '0px' : `${minHeight}px`,
              marginLeft: completedPercentage != 100 ? '6px' : '0px',
              transition: `width ${transitionDuration}ms ease-in-out ${completedPercentage == 100 ? `, height 200ms 0.5s ease-in-out, margin-left ${transitionDuration}ms ${transitionDuration / 1.5}ms` : ''}`,
            }}
            className={classNames.activeIndicator}
          ></div>
          <div
            style={{
              height: isVisible ? '0px' : `${minHeight}px`,
              width: `${minHeight}px`,
              transition: `width ${transitionDuration}ms ease-in-out, height 200ms 0.5s ease-in-out`,
            }}
            className={classNames.stop}
          ></div>
        </div>
      )}
      {(variant === 'circular-determinate' ||
        variant == 'circular-indeterminate') && (
        <motion.svg width="48" height="48" viewBox="0 0 48 48">
          <motion.circle
            cx="50%"
            cy="50%"
            r="calc(50% - 2px)"
            style={{
              strokeLinecap: 'round',
            }}
            initial="hidden"
            animate="visible"
            className={'stroke-primary fill-transparent stroke-[4px]'}
            variants={{
              hidden: { pathLength: completedPercentage / 100 },
              visible: {
                pathLength: completedPercentage / 100,
                transition: {
                  pathLength: {
                    type: 'spring',
                    duration: 1.5,
                    bounce: 0,
                  },
                },
              },
            }}
          />
        </motion.svg>
      )}
    </>
  );
};
