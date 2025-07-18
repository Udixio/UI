import { useEffect, useRef, useState } from 'react';
import { MotionProps } from '../utils';
import { Button } from './Button';
import { ToolTipInterface } from '../interfaces';
import { toolStyle } from '../styles';
import { v4 } from 'uuid';
import { AnimatePresence, motion } from 'motion/react';
import { SyncedFixedWrapper } from '../effects';

export const ToolTip = ({
  variant = 'plain',
  buttons,
  className,
  children,
  title,
  text,
  position,
  targetRef,
  ref,
  trigger = ['hover', 'focus'],
  ...props
}: MotionProps<ToolTipInterface>) => {
  if (!Array.isArray(trigger)) {
    trigger = [trigger];
  }

  if (buttons && !Array.isArray(buttons)) {
    buttons = [buttons];
  }

  const [currentToolTipId, setCurrentToolTipId] = useState<string | null>(null);
  const [id] = useState(v4());
  const [isVisible, setIsVisible] = useState(false);

  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleUpdate = (event: CustomEvent) => {
      setCurrentToolTipId(event.detail);
    };

    document.addEventListener('tooltip-update', handleUpdate as EventListener);
    return () => {
      document.removeEventListener(
        'tooltip-update',
        handleUpdate as EventListener
      );
    };
  }, []);

  useEffect(() => {
    if (timeout.current) clearTimeout(timeout.current);

    if (currentToolTipId) {
      setIsVisible(currentToolTipId === id);
    } else {
      timeout.current = setTimeout(() => {
        setIsVisible(false);
      }, 1200);
    }
  }, [currentToolTipId, id]);

  const addEventListener = (
    element: HTMLElement,
    type: keyof HTMLElementEventMap,
    newHandler: (event: Event) => void
  ) => {
    const originalHandler = (element as any)[`on${type}`]; // Sauvegarde de l'ancien gestionnaire
    element.addEventListener(type, (event: Event) => {
      if (originalHandler) originalHandler.call(element, event); // Appel du gestionnaire existant
      newHandler(event); // Appel du nouveau gestionnaire
    });
  };

  useEffect(() => {
    if (targetRef?.current) {
      const targetElement = targetRef.current;

      if (trigger.includes('hover')) {
        addEventListener(targetElement, 'mouseenter', () => {
          const event = new CustomEvent('tooltip-update', { detail: id });
          document.dispatchEvent(event);
        });

        addEventListener(targetElement, 'mouseleave', () => {
          const event = new CustomEvent('tooltip-update', { detail: null });
          document.dispatchEvent(event);
        });
      }

      if (trigger.includes('click')) {
        addEventListener(targetElement, 'click', () => {
          const event = new CustomEvent('tooltip-update', {
            detail: isVisible ? null : id,
          });
          document.dispatchEvent(event);
        });
      }

      if (trigger.includes('focus')) {
        addEventListener(targetElement, 'focus', () => {
          const event = new CustomEvent('tooltip-update', { detail: id });
          document.dispatchEvent(event);
        });

        addEventListener(targetElement, 'blur', () => {
          const event = new CustomEvent('tooltip-update', { detail: null });
          document.dispatchEvent(event);
        });
      }
    }

    return () => {
      if (timeout.current) clearTimeout(timeout.current);
    };
  }, [targetRef, trigger, id, isVisible]);

  if (!position && typeof window !== 'undefined') {
    if (targetRef?.current && !position) {
      const rect = targetRef.current.getBoundingClientRect();

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      const x = rect.left / viewportWidth; // X entre 0 et 1
      const y = rect.top / viewportHeight; // Y entre 0 et 1

      if (variant === 'plain') {
        if (x < 1 / 3) {
          position = 'right';
        } else if (x > 2 / 3) {
          position = 'left';
        } else {
          position = y > 0.5 ? 'top' : 'bottom';
        }
      } else {
        if (x < 1 / 2 && y < 1 / 2) {
          position = 'bottom-right';
        } else if (x > 1 / 2 && y < 1 / 2) {
          position = 'bottom-left';
        } else if (x > 1 / 2 && y > 1 / 2) {
          position = 'top-left';
        } else if (x < 1 / 2 && y > 1 / 2) {
          position = 'top-right';
        }
      }
    }
  }

  const styles = toolStyle({
    variant,
    buttons,
    className,
    title,
    text,
    position,
    trigger,
    targetRef,
  });

  return (
    <AnimatePresence>
      {isVisible && (
        <SyncedFixedWrapper targetRef={targetRef}>
          <motion.div
            initial={{ opacity: currentToolTipId ? 1 : 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: currentToolTipId ? 0 : 0.3 }}
            exit={{ opacity: currentToolTipId ? 1 : 0 }}
            className={styles.container}
            {...props}
          >
            <motion.div
              className={styles.container}
              layoutId={'tool-tip'}
              transition={{
                type: 'spring',
                stiffness: 200,
                damping: 20,
              }}
            >
              {title && <div className={styles.subHead}>{title}</div>}
              <div className={styles.supportingText}>{text}</div>
              {buttons && (
                <div className={styles.actions}>
                  {Array.isArray(buttons) &&
                    buttons.map((buttonArgs, index) => (
                      <Button
                        key={index}
                        size={'small'}
                        variant={'text'}
                        {...buttonArgs}
                      />
                    ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        </SyncedFixedWrapper>
      )}
    </AnimatePresence>
  );
};
