import React from 'react';
import { itemHelper, ItemProps } from './item.interface';
import { motion } from 'framer-motion';

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
export const Item = ({
  className,
  children,
  visibilityPercentage = 1,
  index,
  inputRange = [0, 1],
  outputRange = [0, 1],
  ...restProps
}: ItemProps) => {
  const styles = itemHelper.getStyles({
    visibilityPercentage,
  });

  const flexBasis =
    normalize(visibilityPercentage, inputRange, outputRange) * 100;

  return (
    <motion.div
      animate={{ flex: '0 0 calc(' + flexBasis + '% - 4px)' }}
      transition={{
        duration: 0.2,
        ease: 'easeOut',
      }}
      className={styles.item}
      {...restProps}
    >
      {children}
      {/*<p*/}
      {/*  className={*/}
      {/*    'text-display-large absolute text-on-surface bg-surface opacity-20 -translate-x-1/2 left-1/2 top-1/2'*/}
      {/*  }*/}
      {/*>*/}
      {/*  {Math.round(visibilityPercentage * 100)}*/}
      {/*</p>*/}
    </motion.div>
  );
};
