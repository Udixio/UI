import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { SnackbarInterface } from '../interfaces/snackbar.interface';
import { useSnackbarStyle } from '../styles/snackbar.style';

import { MotionProps } from '../utils/component';
import { IconButton } from './IconButton';

/**
 * Snackbars show short updates about app processes at the bottom of the screen
 * @status beta
 * @category Communication
 */
export const Snackbar = ({
  message,
  className,
  duration,
  closeIcon = faXmark,
  onClose,
  ...restProps
}: MotionProps<SnackbarInterface>) => {
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
