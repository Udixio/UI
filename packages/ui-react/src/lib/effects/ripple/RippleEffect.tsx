import { AnimatePresence, motion } from 'motion/react';
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
      opacity: 1,
      ['--r' as any]: '25%',
    },
    animate: {
      opacity: 1,
      ['--r' as any]: '100%',
      transition: {
        duration: 0.5,
      },
    },
    exit: {
      opacity: 0,
      ['--r' as any]: '100%',
      transition: {
        duration: 0.3,
      },
    },
  } as const;

  const [isCompleted, setIsCompleted] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [coordinates, setCoordinates] = useState({ x: 50, y: 50 });

  useEffect(() => {
    if (isActive) {
      // restart presence cycle to allow exit animation after mouse up
      setIsCompleted(true);
      setIsCompleted(false);
    }
  }, [isActive]);

  useEffect(() => {
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

  const handleMouseDown = (e: MouseEvent) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const el = triggerRef?.current as Element & {
      clientWidth: number;
      clientHeight: number;
    };
    const rect = el.getBoundingClientRect();
    setIsActive(true);
    setCoordinates({
      x: ((e.clientX - rect.left) / el.clientWidth) * 100,
      y: ((e.clientY - rect.top) / el.clientHeight) * 100,
    });
  };
  const handleMouseLeave = (_e: MouseEvent) => {
    setIsActive(false);
  };

  const handleMouseUp = (_e: MouseEvent) => {
    setIsActive(false);
  };

  // Build the background as a function of state.
  // color token mixed to a subtle alpha
  const colorMix = `color-mix(in srgb, var(--color-${colorName}) 12%, transparent)`;
  // const colorMix = `red`;

  const style: React.CSSProperties & Record<string, any> = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    // supply CSS variables for gradient center and radius
    ['--x' as any]: coordinates.x + '%',
    ['--y' as any]: coordinates.y + '%',
    ['--r' as any]: '0%', // will be animated by motion
    background: `radial-gradient(ellipse at var(--x) var(--y), ${colorMix} var(--r), transparent calc(var(--r) * 2))`,
    pointerEvents: 'none',
  };

  return (
    <AnimatePresence mode="wait">
      {(isActive || (!isActive && !isCompleted)) && (
        <motion.div
          style={style}
          variants={ripple}
          initial="initial"
          animate="animate"
          exit="exit"
          onAnimationComplete={() => setIsCompleted(true)}
        />
      )}
    </AnimatePresence>
  );
};

export default RippleEffect;
