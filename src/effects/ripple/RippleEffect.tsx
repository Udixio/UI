import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';

interface RippleEffectProps {
  triggerRef: React.RefObject<any> | React.ForwardedRef<any>;
  colorName?: string;
}

const RippleEffect: React.FC<RippleEffectProps> = ({
  colorName = 'on-surface',
  triggerRef,
}) => {
  const ripple = {
    initial: {
      opacity: 0,
      borderRadius: '50%',
      width: '25%',
      height: '25%',
    },
    animate: {
      opacity: 1,
      borderRadius: 0,
      width: '200%',
      height: '200%',
      transition: {
        duration: 0.3,
        borderRadius: { duration: 0.3, delay: 0.3 },
      },
    },
  };

  const [isCompleted, setIsCompleted] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [coordinates, setCoordinates] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (isActive) {
      setIsCompleted(true);
      setIsCompleted(false);
    }
  }, [isActive]);

  useEffect(() => {
    // @ts-ignore
    const element = triggerRef?.current;
    if (element) {
      element.addEventListener('mousedown', handleMouseDown);
      element.addEventListener('mouseup', handleMouseUp);
      element.addEventListener('mouseleave', handleMouseLeave);
      return () => {
        element.removeEventListener('mousedown', handleMouseDown);
        element.removeEventListener('mouseup', handleMouseUp);
        element.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, [triggerRef]);

  const handleMouseDown = (e) => {
    // @ts-ignore
    const rect = (triggerRef?.current as Element).getBoundingClientRect();
    setIsActive(true);
    setCoordinates({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };
  const handleMouseLeave = (e) => {
    setIsActive(false);
  };

  const handleMouseUp = (e) => {
    setIsActive(false);
  };

  return (
    <AnimatePresence mode="wait">
      {(isActive || (!isActive && !isCompleted)) && (
        <motion.div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            top: coordinates.y,
            left: coordinates.x,

            background: `rgb(var(--color-${colorName}) / 0.12)`,
            pointerEvents: 'none',
          }}
          variants={ripple}
          initial="initial"
          animate={'animate'}
          exit={{ opacity: 0, transition: { duration: 0 } }}
          onAnimationComplete={() => setIsCompleted(true)}
          className={'transform -translate-x-1/2 -translate-y-1/2'}
        />
      )}
    </AnimatePresence>
  );
};

export default RippleEffect;
