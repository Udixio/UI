import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { iClose } from '@udixio/icons-rounded-400/close';
import {
  type MotionProps,
  type SnackbarInterface,
  snackbarStyle,
} from '@udixio/core';
import { createUseStyle } from '../utils/create-use-style';
import { IconButton } from './IconButton';

export type ReactSnackbarProps = MotionProps<SnackbarInterface>;

export const useSnackbarStyle = createUseStyle(snackbarStyle);

/**
 * Snackbars show short updates about app processes at the bottom of the screen
 * @status beta
 * @category Communication
 * @devx
 * - Uncontrolled visibility; use `duration` to auto-dismiss.
 * @a11y
 * - No `role="status"`/`alert` announcements.
 * @limitations
 * - No queue/stacking and no controlled open prop.
 */
export const Snackbar = ({
  message,
  className,
  duration,
  closeIcon = iClose,
  onClose,
  ...restProps
}: ReactSnackbarProps) => {
  const [isVisible, setIsVisible] = useState(true);

  const styles = useSnackbarStyle({
    className,
    closeIcon,
    duration,
    isVisible,
    onClose,
    message,
  });

  useEffect(() => {
    if (duration) {
      setTimeout(() => {
        handleClose();
      }, duration);
    }
  }, [duration]);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: 'auto' }}
          exit={{ height: 0 }}
          transition={{ duration: 0.1 }}
          className={styles.snackbar}
          {...restProps}
        >
          <div className={styles.container}>
            <p className={styles.supportingText}>{message}</p>
            <IconButton
              onClick={() => handleClose()}
              className={styles.icon}
              icon={closeIcon}
              label={'close the snackbar'}
            ></IconButton>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
