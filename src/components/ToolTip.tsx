import { useCallback, useEffect, useRef, useState } from 'react';
import { ReactProps } from '../utils';
import { Button } from './Button';
import { ToolTipInterface } from '../interfaces';
import { toolStyle } from '../styles';
import { v4 } from 'uuid';
import { motion } from 'motion/react';

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
  const currentToolTipIdRef = useRef<string | null>(null);
  const [id] = useState(v4());
  const isVisible = currentToolTipId === id;

  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleUpdate = (event: CustomEvent) => {
      console.log('current:', event.detail);
      setCurrentToolTipId(event.detail);
      currentToolTipIdRef.current = event.detail;
    };

    document.addEventListener('tooltip-update', handleUpdate as EventListener);
    return () => {
      document.removeEventListener(
        'tooltip-update',
        handleUpdate as EventListener
      );
    };
  }, []);

  const close = useCallback(() => {
    if (currentToolTipIdRef.current === id) {
      const event = new CustomEvent('tooltip-update', { detail: null });
      document.dispatchEvent(event);
    }
  }, [id]);

  const handleMouseEnter = () => {
    if (timeout.current) clearTimeout(timeout.current);
    const event = new CustomEvent('tooltip-update', { detail: id });
    document.dispatchEvent(event);
  };

  const handleMouseLeave = () => {
    timeout.current = setTimeout(() => {
      close();
    }, 1500);
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
      {isVisible && (
        <div className={styles.container}>
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
        </div>
      )}
    </div>
  );
};
