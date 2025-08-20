import React, { useRef } from 'react';
import { CarouselItemInterface } from '../interfaces';
import { motion } from 'motion/react';
import { carouselItemStyle } from '../styles';
import { MotionProps } from '../utils';

/**
 * @status beta
 * @parent Carousel
 */
export const normalize = (
  value: number,
  inputRange: [number, number],
  outputRange: [number, number] = [0, 1],
): number => {
  const [inputMin, inputMax] = inputRange;
  const [outputMin, outputMax] = outputRange;

  const clampedValue = Math.max(inputMin, Math.min(value, inputMax));

  const normalizedValue = (clampedValue - inputMin) / (inputMax - inputMin);

  return outputMin + normalizedValue * (outputMax - outputMin);
};
export const CarouselItem = ({
  className,
  children,
  width = 1,
  index = 0,
  ref: optionalRef,
  ...restProps
}: MotionProps<CarouselItemInterface>) => {
  const defaultRef = useRef(null);
  const ref: React.RefObject<null | HTMLDivElement> = optionalRef || defaultRef;

  const styles = carouselItemStyle({
    className,
    index,
    width: width,
    children,
  });

  return (
    <motion.div
      ref={ref}
      animate={{ width: width + 'px' }}
      transition={{
        duration: 0.5,
        ease: 'linear',
      }}
      className={styles.carouselItem}
      {...restProps}
    >
      {children}
    </motion.div>
  );
};
