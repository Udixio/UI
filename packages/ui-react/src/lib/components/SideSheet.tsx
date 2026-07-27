import { type ReactNode, useEffect, useState } from 'react';
import type { Transition } from 'motion';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { iClose } from '@udixio/icons-rounded-400/close';
import {
  type ReactProps,
  type SideSheetInterface,
  sideSheetStyle,
} from '@udixio/core';
import { createUseStyle } from '../utils/create-use-style';
import { Divider } from './Divider';
import { IconButton } from './IconButton';

export type { SideSheetPosition, SideSheetVariant } from '@udixio/core';

export type ReactSideSheetProps = ReactProps<SideSheetInterface> & {
  children?: ReactNode;
  transition?: Transition;
};

export const useSideSheetStyle = createUseStyle(sideSheetStyle);

/**
 * Side sheets show secondary content anchored to the side of the screen
 * @status beta
 * @category Layout
 * @devx
 * - Controlled via `extended`/`onExtendedChange` or internal state.
 * - `variant="modal"` renders into a portal on `document.body`.
 * @a11y
 * - No focus trap, Escape handling, or `aria-modal` attributes.
 * @limitations
 * - No body scroll lock when open.
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
  closeIcon = iClose,
  transition,
  ...rest
}: ReactSideSheetProps) => {
  transition = { duration: 0.3, ...transition };

  const [isExtended, setIsExtended] = useState(extended ?? true);

  const styles = useSideSheetStyle({
    title,
    position,
    closeIcon,
    className,
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
