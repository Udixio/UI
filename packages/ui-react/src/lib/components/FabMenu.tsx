import React, { useRef, useState } from 'react';
import { FabMenuInterface } from '../interfaces/fab-menu.interface';
import { useFabMenuStyle } from '../styles/fab-menu.style';
import { ReactProps } from '../utils/component';
import { Fab } from './Fab';
import { Button } from './Button';
import { ButtonInterface } from '../interfaces';
import { classNames } from '../utils';
import { IconButton } from './IconButton';
import { faClose } from '@fortawesome/free-solid-svg-icons';
import { AnimatePresence, motion } from 'motion/react';

/**
 * Floating action buttons (FABs) help people take primary actions
 * @status beta
 * @category Action
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
}: ReactProps<FabMenuInterface>) => {
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
    href,
    icon,
    extended,
    label,
    size,
    variant,
    className,
    transition,
    children: label,
    open,
  });

  const MotionFab = motion.create(Fab);
  const MotionIconButton = motion.create(IconButton);
  const MotionButton = motion.create(Button);

  const renderFab = (props) => (
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

  return (
    <div className={styles.fabMenu} ref={resolvedRef} {...restProps}>
      <AnimatePresence>
        {open && (
          <div className={styles.actions} role="menu" aria-hidden={!open}>
            {(() => {
              const total = buttonChildren.length;
              return buttonChildren.map((child, index) => {
                const childProps = (
                  child as React.ReactElement<ReactProps<ButtonInterface>>
                ).props;
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
                        delay: transition?.duration / 2 + delay,
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
                        duration: transition?.duration / 1.5,
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
                          button: classNames('max-w-full overflow-hidden', {
                            'px-0': !open,
                            'bg-primary-container text-on-primary-container ':
                              variant === 'primary',
                            'bg-secondary-container text-on-secondary-container':
                              variant === 'secondary',
                            'bg-tertiary-container text-on-tertiary-container':
                              variant === 'tertiary',
                          }),
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
            layoutId: 'fab-menu',
          })}
        {open && (
          <>
            <MotionIconButton
              layout
              layoutId="fab-menu"
              variant={'filled'}
              className={() => ({
                iconButton: classNames('', {
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
