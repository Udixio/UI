import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { SnackbarProps } from './snackbar.interface';
import { snackbarStyle } from './snackbar.style';
import { IconButton } from '../../action/icon-button';

export const Snackbar = ({
  supportingText,
  className,
  duration,
  closeIcon = faXmark,
  onClose,
  ...restProps
}: SnackbarProps) => {
  const [isVisible, setIsVisible] = useState(true);

  const styles = snackbarStyle({
    className,
    closeIcon,
    duration,
    isVisible,
    onClose,
    supportingText,
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
            <p className={styles.supportingText}>{supportingText}</p>
            <IconButton
              onClick={() => handleClose()}
              className={styles.icon}
              icon={closeIcon}
              arialLabel={'close the snackbar'}
            ></IconButton>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
