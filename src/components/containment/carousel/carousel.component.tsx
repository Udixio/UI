import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { CarouselProps } from './carousel.interface';
import { CarouselItem, ItemProps, normalize } from './item';
import { motion, motionValue, useTransform } from 'framer-motion';

import { carouselStyle } from './carousel-style';
import { CustomScroll } from '../../../effects/custom-scroll.effect';

export const Carousel = ({
  variant = 'hero',
  height = '400px',
  className,
  children,
  ref: optionalRef,
  marginPourcent = 0,
  inputRange = [0.21, 0.65],
  outputRange = [42, 300],
  gap = 8,
  ...restProps
}: CarouselProps) => {
  const defaultRef = useRef(null);
  const ref = optionalRef || defaultRef;

  const styles = carouselStyle({
    className,
    children,
    variant,
    height,
    inputRange,
    outputRange,
    marginPourcent,
    gap,
  });

  const items = React.Children.toArray(children).filter(
    (child) => React.isValidElement(child) && child.type === CarouselItem
  );

  const trackRef = useRef<HTMLDivElement>(null);
  const [itemsWidth, setItemsWidth] = useState<number[]>([]);
  const [scroll, setScroll] = useState<{
    scrollProgress: number;
    scrollTotal: number;
    scrollVisible: number;
    scroll: number;
  }>({
    scrollProgress: 0,
    scrollTotal: 0,
    scrollVisible: 0,
    scroll: 0,
  });
  const calculatePercentages = () => {
    if (!trackRef.current || !ref.current) return [];

    const { scrollVisible, scrollProgress } = scroll;

    function assignRelativeIndexes(
      values: number[],
      progressScroll: number
    ): number[] {
      return values.map(
        (value) => (value - progressScroll) / Math.abs(values[1] - values[0])
      );
    }

    let itemValues = items.map((_, index) => {
      const itemRef = itemRefs[index];

      if (!itemRef.current || !trackRef.current) return 0;

      let itemScrollXCenter = index / (items.length - 1);

      if (itemScrollXCenter > 1) itemScrollXCenter = 1;
      if (itemScrollXCenter < 0) itemScrollXCenter = 0;

      return itemScrollXCenter;
    });

    itemValues = assignRelativeIndexes(itemValues, scrollProgress);

    let visible =
      (scrollVisible - (outputRange[0] + gap)) / (outputRange[1] + gap);

    itemValues
      .map((value, index) => ({ value: Math.abs(value), originalIndex: index })) // Associer chaque élément à son index
      .sort((a, b) => a.value - b.value)
      .forEach((item) => {
        const result = normalize(
          visible,
          [0, 1],
          [outputRange[0], outputRange[1]]
        );
        visible--;
        itemValues[item.originalIndex] = result;
      });

    return itemValues;
  };
  const itemRefs = useRef<React.RefObject<HTMLDivElement | null>[]>([]).current;

  if (itemRefs.length !== items.length) {
    items.forEach((_, i) => {
      if (!itemRefs[i]) {
        itemRefs[i] = React.createRef<HTMLDivElement>(); // Crée une nouvelle ref si manquante
      }
    });
  }

  const renderItems = items.map((child, index) => {
    return React.cloneElement(child as React.ReactElement<ItemProps>, {
      width: itemsWidth[index],
      ref: itemRefs[index],
      key: index,
      index,
      inputRange: inputRange,
      outputRange: outputRange,
    });
  });

  const scrollProgress = motionValue(scroll.scrollProgress);

  const transform = useTransform(
    scrollProgress,
    [0, 1],
    [0, 1 - scroll.scrollVisible / scroll.scrollTotal]
  );

  const percentTransform = useTransform(
    transform,
    (value) => `${-value * 100}%`
  );

  const handleScroll = (args: {
    scrollProgress: number;
    scrollTotal: number;
    scrollVisible: number;
    scroll: number;
  }) => {
    if (args.scrollTotal > 0) {
      setScroll(args);
    }
  };

  useEffect(() => {
    const updatedPercentages = calculatePercentages();
    setItemsWidth(updatedPercentages);
  }, [scroll]);

  const [scrollSize, setScrollSize] = useState(0);
  useLayoutEffect(() => {
    const visible =
      ((ref.current?.clientWidth ?? 200) - (outputRange[0] + gap)) /
      (outputRange[1] + gap);
    const result =
      (outputRange[0] + gap) * renderItems.length +
      visible * outputRange[1] -
      visible * outputRange[0];

    setScrollSize(result);
  }, [ref, itemRefs]);

  return (
    <div
      style={{ height }}
      className={styles.carousel}
      ref={ref}
      {...restProps}
    >
      <CustomScroll
        orientation={'horizontal'}
        onScroll={handleScroll}
        scrollSize={scrollSize}
      >
        <motion.div
          className={styles.track}
          ref={trackRef}
          style={{
            transitionDuration: '0.5s',
            transitionTimingFunction: 'ease-out',
            gap: `${gap}px`,
            x: percentTransform,
            width: scrollSize,
          }}
        >
          {renderItems}
        </motion.div>
      </CustomScroll>
    </div>
  );
};
