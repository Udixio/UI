import React, { useRef } from 'react';
import { Icon } from '../../../icon';

import { RippleEffect } from '../../../effects/ripple';
import { AnimatePresence, motion } from 'framer-motion';
import { FabProps } from './fab.interface';
import { fabStyle } from './fab.style';
import { classNames } from '../../../utils';

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
  ...restProps
}: FabProps) => {
  const ElementType = href ? 'a' : 'button';

  const styles = fabStyle({
    icon,
    isExtended,
    label,
    size,
    variant,
    className,
  });

  const defaultRef = useRef(null);
  const resolvedRef = ref || defaultRef;

  const labelVariants = {
    visible: {
      width: 'auto',
      marginLeft: 12,
      opacity: 1,
      transition: { opacity: { delay: 0.1 } },
    },
    hidden: {
      width: 0,
      marginLeft: 0,
      opacity: 0,
      transition: { marginLeft: { delay: 0.2 } },
    },
  };
  return (
    <ElementType
      {...(restProps as any)}
      ref={resolvedRef}
      href={href}
      className={styles.fab}
    >
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
            transition={{ duration: 0.3 }}
            className={styles.label}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </ElementType>
  );
};
