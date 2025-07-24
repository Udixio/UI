import {
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
} from 'react';
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
  if (!children && !targetRef) {
    throw new Error('ToolTip must have a child or a targetRef');
  }
  if (!Array.isArray(trigger)) {
    trigger = [trigger];
  }

  if (buttons && !Array.isArray(buttons)) {
    buttons = [buttons];
  }

  const internalRef = useRef<HTMLElement | null>(null); // Ref interne au cas où targetRef est undefined
  const resolvedRef = targetRef || internalRef; // Utilise targetRef si défini, sinon internalRef

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

  // Ajouter des gestionnaires sur l'élément cible (targetRef ou internalRef)

  const handleMouseEnter = () => {
    if (trigger.includes('hover')) {
      const event = new CustomEvent('tooltip-update', { detail: id });
      document.dispatchEvent(event);
    }
  };

  const handleMouseLeave = () => {
    if (trigger.includes('hover')) {
      const event = new CustomEvent('tooltip-update', { detail: null });
      document.dispatchEvent(event);
    }
  };

  const handleClick = () => {
    if (trigger.includes('click')) {
      const event = new CustomEvent('tooltip-update', {
        detail: isVisible ? null : id,
      });
      document.dispatchEvent(event);
    }
  };

  const handleFocus = () => {
    if (trigger.includes('focus')) {
      const event = new CustomEvent('tooltip-update', { detail: id });
      document.dispatchEvent(event);
    }
  };

  const handleBlur = () => {
    if (trigger.includes('focus')) {
      const event = new CustomEvent('tooltip-update', { detail: null });
      document.dispatchEvent(event);
    }
  };

  useEffect(() => {
    if (resolvedRef?.current) {
      const targetElement = resolvedRef.current;

      targetElement.addEventListener('mouseenter', handleMouseEnter);
      targetElement.addEventListener('mouseleave', handleMouseLeave);
      targetElement.addEventListener('click', handleClick);
      targetElement.addEventListener('focus', handleFocus);
      targetElement.addEventListener('blur', handleBlur);

      // Nettoyage au démontage
      return () => {
        targetElement.removeEventListener('mouseenter', handleMouseEnter);
        targetElement.removeEventListener('mouseleave', handleMouseLeave);
        targetElement.removeEventListener('click', handleClick);
        targetElement.removeEventListener('focus', handleFocus);
        targetElement.removeEventListener('blur', handleBlur);
      };
    }
  }, [resolvedRef, trigger, id, isVisible]);

  // Si targetRef est undefined, on applique la réf au premier enfant
  const enhancedChildren =
    !targetRef && isValidElement(children)
      ? cloneElement(children, { ref: internalRef } as any)
      : children;

  if (!position && typeof window !== 'undefined') {
    if (resolvedRef?.current && !position) {
      const rect = resolvedRef.current.getBoundingClientRect();

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
    targetRef: targetRef as any,
    children: children as any,
  });

  return (
    <>
      {enhancedChildren}
      <AnimatePresence>
        {isVisible && (
          <SyncedFixedWrapper targetRef={resolvedRef}>
            <motion.div
              initial={{ opacity: currentToolTipId ? 1 : 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: currentToolTipId ? 0 : 0.3 }}
              exit={{ opacity: currentToolTipId ? 1 : 0 }}
              className={styles.toolTip}
              {...props}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
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
    </>
  );
};
