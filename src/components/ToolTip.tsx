import { useEffect, useRef, useState } from 'react';
import { ReactProps } from '../utils';
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
  ref,
}: ReactProps<ToolTipInterface>) => {
  const defaultRef = useRef<HTMLDivElement>(null);
  const resolvedRef = ref || defaultRef;

  if (buttons && !Array.isArray(buttons)) {
    buttons = [buttons];
  }

  const [currentToolTipId, setCurrentToolTipId] = useState<string | null>(null);
  const [id] = useState(v4());
  const [isVisible, setIsVisible] = useState(currentToolTipId === id);

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
      setIsVisible(currentToolTipId == id);
    } else {
      timeout.current = setTimeout(() => {
        if (currentToolTipId !== id) {
          setIsVisible(false);
        }
      }, 1_200);
    }
  }, [currentToolTipId]);

  const handleMouseEnter = () => {
    const event = new CustomEvent('tooltip-update', { detail: id });
    document.dispatchEvent(event);
  };

  const handleMouseLeave = () => {
    const event = new CustomEvent('tooltip-update', { detail: null });
    document.dispatchEvent(event);
  };

  useEffect(() => {
    return () => {
      if (timeout.current) clearTimeout(timeout.current);
    };
  }, []);

  if (!position && typeof window != undefined) {
    if (resolvedRef?.current && !position) {
      const rect = resolvedRef.current.getBoundingClientRect();

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      const documentWidth = document.documentElement.scrollWidth;
      const documentHeight = document.documentElement.scrollHeight;

      const x = rect.left / viewportWidth; // X entre 0 et 1
      const y = rect.top / viewportHeight; // Y entre 0 et 1

      if (variant == 'plain') {
        if (x < 1 / 3) {
          position = 'right';
        } else if (x > 2 / 3) {
          position = 'left';
        } else {
          if (y > 0.5) {
            position = 'top';
          } else {
            position = 'bottom';
          }
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
  });

  return (
    <div
      ref={resolvedRef}
      className={styles.toolTip}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      <AnimatePresence>
        {isVisible && (
          <SyncedFixedWrapper targetRef={resolvedRef}>
            <motion.div
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              initial={{ opacity: currentToolTipId ? 1 : 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: currentToolTipId ? 0 : 0.3 }}
              exit={{ opacity: currentToolTipId ? 1 : 0 }}
              className={styles.container}
            >
              <motion.div
                className={styles.content}
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
    </div>
  );
};
