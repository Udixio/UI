import React, { useRef } from 'react';
import { CarouselItemInterface } from '../interfaces';
import { useCarouselItemStyle } from '../styles';
import { MotionProps } from '../utils';

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

/**
 * @status beta
 * @parent Carousel
 */
export const CarouselItem = ({
  className,
  children,
  width,
  index = 0,
  outputRange,
  ref: optionalRef,
  ...restProps
}: MotionProps<CarouselItemInterface>) => {
  const defaultRef = useRef(null);
  const ref: React.RefObject<null | HTMLDivElement> = optionalRef || defaultRef;

  const styles = useCarouselItemStyle({
    className,
    index,
    width,
    children,
    outputRange,
  });

  return (
    <div
      ref={ref}
      style={{
        width: width + 'px',
        maxWidth: outputRange[1] + 'px',
        minWidth: outputRange[0] + 'px',
        willChange: 'width',
      }}
      transition={{
        duration: 0.5,
        ease: 'linear',
      }}
      className={styles.carouselItem}
      {...restProps}
    >
      {children}
    </div>
  );
};
