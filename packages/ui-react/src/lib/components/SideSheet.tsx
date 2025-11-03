import { MotionProps } from '../utils';
import { SideSheetInterface } from '../interfaces';
import { Divider } from './Divider';

import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { IconButton } from './IconButton';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { sideSheetStyle } from '../styles';

/**
 * Side sheets show secondary content anchored to the side of the screen
 * @status beta
 * @category Layout
 */
export const SideSheet = ({
  variant = 'standard',
  className,
  children,
  title,
  position = 'right',
  extended,
  divider,
  onExtendedChange,
  closeIcon = faXmark,
  transition,
  ...rest
}: MotionProps<SideSheetInterface>) => {
  transition = { duration: 0.3, ...transition };

  const [isExtended, setIsExtended] = useState(extended ?? true);

  const styles = sideSheetStyle({
    transition,
    title,
    position,
    closeIcon,
    className,
    children,
    onExtendedChange,
    divider,
    isExtended,
    extended: isExtended,
    variant,
  });

  useEffect(() => {
    onExtendedChange?.(isExtended ?? false);
  }, [isExtended]);

  useEffect(() => {
    if (extended != undefined) {
      setIsExtended(extended);
    }
  }, [extended]);

  const variants = {
    close: {
      width: 0,
    },
    open: {
      width: 'auto',
    },
  };

  const render = () => (
    <>
      <AnimatePresence>
        {variant == 'modal' && isExtended && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={transition}
            onClick={() => setIsExtended(false)}
            className={styles.overlay}
          ></motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isExtended && (
          <div
            {...rest}
            className={styles.sideSheet}
            style={{ transition: transition.duration + 's' }}
          >
            <motion.div
              variants={variants}
              initial={extended === false ? 'open' : 'close'}
              animate={'open'}
              exit={'close'}
              className={styles.container}
            >
              <div className={styles.header}>
                {title && <p className={styles.title}>{title}</p>}
                <IconButton
                  size={'small'}
                  label={'close'}
                  icon={closeIcon}
                  onClick={() => setIsExtended(false)}
                  className={styles.closeButton}
                ></IconButton>
              </div>
              <div
                className={styles.content}
                style={{ transition: transition.duration + 's' }}
              >
                {children}
              </div>
            </motion.div>
            {(divider == undefined && variant == 'standard'
              ? true
              : divider) && (
              <Divider className={styles.divider} orientation="vertical" />
            )}
          </div>
        )}
      </AnimatePresence>
    </>
  );

  if (variant == 'modal') {
    return createPortal(render(), document.body);
  }

  return render();
};
