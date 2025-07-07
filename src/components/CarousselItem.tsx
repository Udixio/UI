import React, { useRef } from 'react';
import { ItemProps } from '../interfaces/carousel-item.interface';
import { motion } from 'framer-motion';
import { carousselItemStyle } from '../styles/caroussel-item.style';

export const normalize = (
  value: number,
  inputRange: [number, number],
  outputRange: [number, number] = [0, 1]
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
}: ItemProps) => {
  const defaultRef = useRef(null);
  const ref: React.RefObject<null | HTMLDivElement> = optionalRef || defaultRef;

  const styles = carousselItemStyle({
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
      className={styles.item}
      {...restProps}
    >
      {children}
    </motion.div>
  );
};
