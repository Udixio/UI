import React, { useId, useRef, useState, type ReactNode } from 'react';
import type { Transition } from 'motion';
import {
  type ButtonInterface,
  classNames,
  type FabMenuInterface,
  fabMenuStyle,
  type ReactProps,
} from '@udixio/core';
import { createUseStyle } from '../utils/create-use-style';
import { Fab } from './Fab';
import { Button } from './Button';
import { IconButton } from './IconButton';
import { faClose } from '@fortawesome/free-solid-svg-icons';
import { AnimatePresence, motion } from 'motion/react';

export type { FabMenuVariant } from '@udixio/core';

export type ReactFabMenuProps = ReactProps<FabMenuInterface> & {
  children?: ReactNode;
  href?: string;
  transition?: Transition;
};

export const useFabMenuStyle = createUseStyle(fabMenuStyle);

/**
 * Floating action buttons (FABs) help people take primary actions
 * @status beta
 * @category Action
 * @devx
 * - Only `Button` children are rendered as actions.
 * - Controlled via `open`/`onOpenChange` or `defaultOpen`.
 * @a11y
 * - No focus trap or Escape handling when open.
 * @limitations
 * - No outside-click handling; close uses the explicit close button.
 */
export const FabMenu = ({
  className,
  label,
  variant = 'primary',
  size = 'medium',
  href,
  icon,
  extended = false,
  ref,
  transition,
  children,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  ...restProps
}: ReactFabMenuProps) => {
  transition = { duration: 0.3, ease: 'easeInOut', ...transition };

  const defaultRef = useRef(null);
  const resolvedRef = ref || defaultRef;

  // Controlled/uncontrolled open state
  const isControlled = typeof openProp === 'boolean';
  const [internalOpen, setInternalOpen] = useState<boolean>(defaultOpen);
  const open = isControlled ? (openProp as boolean) : internalOpen;
  const setOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  const buttonChildren = React.Children.toArray(children).filter(
    (child) => React.isValidElement(child) && child.type === Button,
  );

  const styles = useFabMenuStyle({
    variant,
    label,
    icon,
    size,
    extended,
    open,
    defaultOpen,
    onOpenChange,
    isOpen: open,
    className,
  });

  const MotionFab = motion.create(Fab);
  const MotionIconButton = motion.create(IconButton);
  const renderFab = (props: Record<string, unknown>) => (
    <MotionFab
      icon={icon}
      extended={extended}
      label={label}
      variant={(variant + 'Container') as any}
      size={size}
      className={styles.fab + ' ' + (className ?? '')}
      aria-expanded={open}
      onClick={() => setOpen(true)}
      style={{ transition: 'border-radius 0.3s ease-in-out' }}
      transition={{
        duration: transition.duration,
        ease: 'easeInOut',
        borderRadius: { duration: transition.duration, ease: 'easeInOut' },
        background: { duration: transition.duration, ease: 'easeInOut' },
        ...transition,
      }}
      {...props}
    />
  );

  const id = useId();

  return (
    <div className={styles.fabMenu} ref={resolvedRef} {...restProps}>
      <AnimatePresence>
        {open && (
          <div className={styles.actions} role="menu" aria-hidden={!open}>
            {(() => {
              const total = buttonChildren.length;
              return buttonChildren.map((child, index) => {
                const reverseIndex = total - 1 - index; // inverser l'ordre d'animation
                const delay = (transition?.delay ?? 0) + reverseIndex * 0.06; // délai échelonné inversé, un peu plus marqué

                const variants = {
                  open: {
                    overflow: 'visible',
                    opacity: 1,
                    width: 'auto',
                    transition: {
                      ...transition,
                      delay,
                      opacity: {
                        delay: transition.duration! / 2 + delay,
                      },
                    },
                  },
                  close: {
                    overflow: 'hidden',
                    opacity: 0,
                    width: 0,
                    transition: {
                      ...transition,
                      delay,
                      opacity: {
                        duration: transition.duration! / 1.5,
                      },
                    },
                  },
                };

                return (
                  <motion.div
                    initial={'close'}
                    animate={'open'}
                    variants={variants}
                    transition={transition}
                    exit={'close'}
                  >
                    {React.cloneElement(
                      child as React.ReactElement<ReactProps<ButtonInterface>>,
                      {
                        key: index,
                        shape: 'rounded',
                        variant: 'filled',
                        className: () => ({
                          button: classNames(
                            'max-w-full overflow-hidden text-nowrap',
                            {
                              'px-0': !open,
                              'bg-primary-container text-on-primary-container ':
                                variant === 'primary',
                              'bg-secondary-container text-on-secondary-container':
                                variant === 'secondary',
                              'bg-tertiary-container text-on-tertiary-container':
                                variant === 'tertiary',
                            },
                          ),
                          stateLayer: classNames({
                            'state-on-primary-container': variant === 'primary',
                            'state-on-secondary-container':
                              variant === 'secondary',
                            'state-on-tertiary-container':
                              variant === 'tertiary',
                          }),
                        }),
                      },
                    )}
                  </motion.div>
                );
              });
            })()}
          </div>
        )}
      </AnimatePresence>

      {renderFab({
        className: 'invisible pointer-events-none',
      })}
      <div className={'absolute right-0 top-0'}>
        {!open &&
          renderFab({
            className: '',
            layout: true,
            layoutId: 'fab-menu' + id,
          })}
        {open && (
          <>
            <MotionIconButton
              layout
              layoutId={'fab-menu' + id}
              variant={'filled'}
              className={() => ({
                iconButton: classNames({
                  'bg-primary text-on-primary': variant === 'primary',
                  'bg-secondary text-on-secondary': variant === 'secondary',
                  'bg-tertiary text-on-tertiary': variant === 'tertiary',
                }),
                stateLayer: classNames({
                  '[--default-color:var(--color-on-primary)]':
                    variant === 'primary',
                  '[--default-color:var(--color-on-secondary)]':
                    variant === 'secondary',
                  '[--default-color:var(--color-on-tertiary)]':
                    variant === 'tertiary',
                }),
              })}
              style={{ transition: 'border-radius 0.3s ease-in-out' }}
              transition={{
                duration: transition.duration,
                ease: 'easeInOut',
                borderRadius: {
                  duration: transition.duration,
                  ease: 'easeInOut',
                },
                background: {
                  duration: transition.duration,
                  ease: 'easeInOut',
                },
                ...transition,
              }}
              icon={faClose}
              onClick={() => setOpen(false)}
            >
              Close
            </MotionIconButton>
          </>
        )}
      </div>
    </div>
  );
};
