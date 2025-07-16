import { useEffect, useRef, useState } from 'react';
import { ReactProps } from '../utils';
import { Button } from './Button';
import { ToolTipInterface } from '../interfaces';
import { toolStyle } from '../styles';
import { v4 } from 'uuid';
import { AnimatePresence, motion } from 'motion/react';

export const ToolTip = ({
  variant = 'plain',
  buttons,
  className,
  children,
  title,
  text,
  position,
}: ReactProps<ToolTipInterface>) => {
  const [currentToolTipId, setCurrentToolTipId] = useState<string | null>(null);
  const [id] = useState(v4());
  const [isVisible, setIsVisible] = useState(currentToolTipId === id);
  const isReplaced = currentToolTipId != null;

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
      className={styles.toolTip}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: currentToolTipId ? 1 : 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            exit={{ opacity: currentToolTipId ? 1 : 0 }}
            className={styles.container}
          >
            <motion.div
              className={styles.content}
              layoutId={'tool-tip'}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 27.5,
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
        )}
      </AnimatePresence>
    </div>
  );
};
