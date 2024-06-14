import React, { forwardRef, useEffect, useState } from 'react';
import { StyleProps, StylesHelper } from '../../utils';
import { SnackbarStyle } from './SnackbarStyle';
import { AnimatePresence, motion } from 'framer-motion';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { IconButton } from '../../button';

export interface SnackbarState {
  supportingText: string;
}

export type SnackbarElement =
  | 'snackbar'
  | 'container'
  | 'supportingText'
  | 'action'
  | 'icon';

export interface SnackbarProps
  extends StyleProps<Omit<SnackbarState, 'isChanging'>, SnackbarElement>,
    SnackbarState,
    Omit<
      React.HTMLAttributes<HTMLElement>,
      'className' | 'value' | 'onChange'
    > {
  closeIcon?: IconDefinition;
  duration?: number;
}

export const Snackbar = forwardRef<HTMLElement, SnackbarProps>((args, ref) => {
  const {
    supportingText,
    className,
    duration,
    closeIcon,
    ...restProps
  }: SnackbarProps = args;

  const [isVisible, setIsVisible] = useState(true);

  const getClassNames = (() => {
    return StylesHelper.classNamesElements<SnackbarState, SnackbarElement>({
      default: 'snackbar',
      classNameList: [className, SnackbarStyle],
      states: {
        supportingText,
      },
    });
  })();

  useEffect(() => {
    if (duration) {
      setTimeout(() => {
        setIsVisible(false);
      }, duration);
    }
  }, [duration]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: 'auto' }}
          exit={{ height: 0 }}
          transition={{ duration: 0.1 }}
          className={getClassNames.snackbar}
          ref={ref}
          {...restProps}
        >
          <div className={getClassNames.container}>
            <p className={getClassNames.supportingText}>{supportingText}</p>
            <IconButton
              onClick={() => setIsVisible(false)}
              className={getClassNames.icon}
              icon={closeIcon ?? faXmark}
              arialLabel={'close the snackbar'}
            ></IconButton>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
