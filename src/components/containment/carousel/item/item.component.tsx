import React, { useRef } from 'react';
import { ItemProps } from './item.interface';
import { motion } from 'framer-motion';
import { itemStyle } from './item.style';

const normalize = (
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
  visibilityPercentage = 1,
  index = 0,
  inputRange = [0, 1],
  outputRange = [0, 1],
  ref: optionalRef,
  ...restProps
}: ItemProps) => {
  const defaultRef = useRef(null);
  const ref: React.RefObject<null | HTMLDivElement> = optionalRef || defaultRef;

  const styles = itemStyle({
    className,
    index,
    inputRange,
    outputRange,
    visibilityPercentage,
    children,
  });

  const flexBasis =
    normalize(visibilityPercentage, inputRange, outputRange) * 100;

  return (
    <motion.div
      ref={ref}
      animate={{ flex: '0 0 calc(' + flexBasis + '% - 4px)' }}
      transition={{
        duration: 0.2,
        ease: 'easeOut',
      }}
      className={styles.item}
      {...restProps}
    >
      {children}
    </motion.div>
  );
};
