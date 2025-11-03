import React, { useRef } from 'react';
import { Icon } from '../icon';
import { AnimatePresence, motion } from 'motion/react';
import { FabInterface } from '../interfaces/fab.interface';
import { useFabStyle } from '../styles/fab.style';
import { classNames } from '../utils';
import { ReactProps } from '../utils/component';
import { ToolTip } from './ToolTip';
import { State } from '../effects';

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
  extended = false,
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

  const styles = useFabStyle({
    href,
    icon,
    extended,
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
      aria-label={extended ? undefined : label}
      className={styles.fab}
    >
      <ToolTip
        trigger={extended ? null : undefined}
        text={label}
        targetRef={resolvedRef}
      />
      <State
        style={{ transition: transition.duration + 's' }}
        className={styles.stateLayer}
        colorName={classNames({
          'on-surface': variant == 'surface',
          'on-primary-container': variant == 'primary',
          'on-secondary-container': variant == 'secondary',
          'on-tertiary-container': variant == 'tertiary',
        })}
        stateClassName={'state-ripple-group-[fab]'}
      />
      <Icon icon={icon} className={styles.icon} />
      <AnimatePresence>
        {extended && (
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
