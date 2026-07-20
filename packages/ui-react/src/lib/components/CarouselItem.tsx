import React, { useRef, type ReactNode } from 'react';
import {
  carouselItemStyle,
  type CarouselItemInterface,
  type MotionProps,
} from '@udixio/core';
import { createUseStyle } from '../utils/create-use-style';

export type ReactCarouselItemProps = MotionProps<CarouselItemInterface> & {
  children?: ReactNode;
};

export const useCarouselItemStyle = createUseStyle(carouselItemStyle);

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
 * @devx
 * - Intended for use inside `Carousel`; width and outputRange drive sizing.
 * @limitations
 * - Requires `outputRange` for min/max sizing; missing values can break layout.
 */
export const CarouselItem = ({
  className,
  children,
  width,
  index = 0,
  outputRange,
  ref: optionalRef,
  ...restProps
}: ReactCarouselItemProps) => {
  const defaultRef = useRef(null);
  const ref: React.RefObject<null | HTMLDivElement> = optionalRef || defaultRef;

  const styles = useCarouselItemStyle({
    width,
    index,
    outputRange,
    className,
  });

  return (
    <div
      ref={ref}
      style={{
        width: 'var(--carousel-item-width, 100%)',
        maxWidth: outputRange ? outputRange[1] + 'px' : undefined,
        minWidth: outputRange ? outputRange[0] + 'px' : undefined,
      }}
      className={styles.carouselItem}
      {...restProps}
    >
      {children}
    </div>
  );
};
