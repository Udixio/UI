import { useRef } from 'react';
import { Icon } from '../icon';

import { RippleEffect } from '../effects/ripple';
import { AnimatePresence, motion } from 'motion/react';
import { FabInterface } from '../interfaces/fab.interface';
import { fabStyle } from '../styles/fab.style';
import { classNames } from '../utils';
import { ReactProps } from '../utils/component';
import { ToolTip } from './ToolTip';

/**
 * Floating action buttons (FABs) help people take primary actions
 * @status beta
 * @category Action
 */
export const Fab = ({
  className,
  label,
  variant = 'primary',
  size = 'medium',
  href,
  type,
  icon,
  isExtended = false,
  ref,
  transition,
  children,
  ...restProps
}: ReactProps<FabInterface>) => {
  if (children) label = children;
  if (!label) {
    throw new Error(
      'FAB component requires either a label prop or children content',
    );
  }
  const ElementType = href ? 'a' : 'button';

  const styles = fabStyle({
    href,
    icon,
    isExtended,
    label,
    size,
    variant,
    className,
    transition,
    children: label,
  });

  transition = { duration: 0.3, ...transition };

  const defaultRef = useRef(null);
  const resolvedRef = ref || defaultRef;

  const labelVariants = {
    visible: {
      width: 'auto',
      marginLeft: 12,
      opacity: 1,
      transition: {
        ...transition,
        opacity: {
          duration: transition.duration! / 2,
          delay: transition.duration! - transition.duration! / 2,
        },
      },
    },
    hidden: {
      width: 0,
      marginLeft: 0,
      opacity: 0,
      transition: {
        ...transition,
        marginLeft: {
          duration: transition.duration! / 2,
          delay: transition.duration! - transition.duration! / 2,
        },
      },
    },
  };
  return (
    <ElementType
      {...(restProps as any)}
      ref={resolvedRef}
      href={href}
      aria-label={isExtended ? undefined : label}
      className={styles.fab}
    >
      <ToolTip
        trigger={isExtended ? null : undefined}
        text={label}
        targetRef={resolvedRef}
      />
      <span className={styles.stateLayer}>
        <RippleEffect
          colorName={classNames({
            primary: variant == 'surface',
            'on-primary-container': variant == 'primary',
            'on-secondary-container': variant == 'secondary',
            'on-tertiary-container': variant == 'tertiary',
          })}
          triggerRef={resolvedRef}
        />
      </span>
      <Icon icon={icon} className={styles.icon} />
      <AnimatePresence>
        {isExtended && (
          <motion.span
            variants={labelVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className={styles.label}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </ElementType>
  );
};
