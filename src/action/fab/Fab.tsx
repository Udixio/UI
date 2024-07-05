import React, { forwardRef, useRef } from 'react';

import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { StyleProps, StylesHelper } from '../../utils';
import { Icon } from '../../icon';
import { fabStyle } from './FabStyle';
import classNames from 'classnames';
import { RippleEffect } from '../../effects/ripple';
import { AnimatePresence, motion } from 'framer-motion';

export type FabVariant = 'surface' | 'primary' | 'secondary' | 'tertiary';

export interface FabState {
  variant?: FabVariant;
  label?: string;
  href?: string;
  title?: string;
  icon: IconDefinition;
  size?: 'small' | 'medium' | 'large';
  isExtended?: boolean;
}

export type FabElement = 'fab' | 'stateLayer' | 'icon' | 'label';

export interface FabProps
  extends StyleProps<FabState, FabElement>,
    FabState,
    Omit<React.AllHTMLAttributes<HTMLElement>, 'className' | 'size'> {}

export const Fab = forwardRef<HTMLButtonElement | HTMLAnchorElement, FabProps>(
  (args, ref) => {
    const {
      className,
      label,
      variant = 'primary',
      size = 'medium',
      href,
      title,
      type,
      icon,
      isExtended,
      ...restProps
    }: FabProps = args;

    const ElementType = href ? 'a' : 'button';

    let linkProps: any = {};
    if (href) {
      linkProps.href = href;
      linkProps.title = title;
    }

    let buttonProps: any = {};
    if (!href) {
      buttonProps.type = type;
    }

    const getClassNames = (() => {
      return StylesHelper.classNamesElements<FabState, FabElement>({
        default: 'fab',
        classNameList: [className, fabStyle],
        states: {
          variant,
          icon,
          href,
          title,
          label,
          size,
          isExtended,
        },
      });
    })();

    const defaultRef = useRef();
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
        {...restProps}
        ref={resolvedRef}
        href={href}
        title={title}
        className={getClassNames.fab}
        {...buttonProps}
        {...linkProps}
      >
        <span className={getClassNames.stateLayer}>
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
        <Icon icon={icon} className={getClassNames.icon} />
        <AnimatePresence>
          {isExtended && (
            <motion.span
              variants={labelVariants} // Appliquer les variantes
              initial="hidden"
              animate="visible"
              exit="hidden"
              transition={{ duration: 0.3 }}
              className={getClassNames.label}
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </ElementType>
    );
  }
);
