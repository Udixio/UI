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
  outputRange = [0.1, 1 / 3],
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
  const [visibilityPercentages, setVisibilityPercentages] = useState<number[]>(
    []
  );
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
  const calculatePercentages = (scrollXProgressValue: number) => {
    if (!trackRef.current || !ref.current) return [];

    const { scrollVisible, scrollTotal, scrollProgress } = scroll;

    const invisiblePourcent = 1 - scrollVisible / scrollTotal;

    const trackInvisiblePourcent = {
      left: normalize(scrollProgress, [0, 1], [0, invisiblePourcent]),
      right: normalize(1 - scrollProgress, [0, 1], [0, invisiblePourcent]),
    };

    return items.map((_, index) => {
      const itemRef = itemRefs[index];

      if (!itemRef.current || !trackRef.current) return 0;

      let itemScrollXCenter = index / (items.length - 1);

      let itemXPourcent;
      let isOnLeft;

      if (itemScrollXCenter > 1) itemScrollXCenter = 1;
      if (itemScrollXCenter < 0) itemScrollXCenter = 0;
      if (itemScrollXCenter !== scrollXProgressValue) {
        isOnLeft = scrollXProgressValue > itemScrollXCenter;
        const min = isOnLeft ? 0 : scrollXProgressValue;
        const max = isOnLeft ? scrollXProgressValue : 1;
        itemXPourcent = (itemScrollXCenter - min) / (max - min);
        if (!isOnLeft) {
          itemXPourcent = 1 - itemXPourcent;
        }
      } else {
        return 1;
      }

      return normalize(itemXPourcent, [
        isOnLeft ? trackInvisiblePourcent.left : trackInvisiblePourcent.right,
        1,
      ]);
    });
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
      visibilityPercentage: visibilityPercentages[index], // Passer la valeur de visibilité calculée
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
    const updatedPercentages = calculatePercentages(scroll.scrollProgress);
    setVisibilityPercentages(updatedPercentages);
  }, [scroll]);

  const [scrollSize, setScrollSize] = useState(0);
  useLayoutEffect(() => {
    setScrollSize(
      ((ref.current?.clientWidth ?? 1) * outputRange[0] + gap) *
        renderItems.length
    );
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
            gap: `${gap}px`,
            x: percentTransform,
          }}
        >
          {renderItems}
        </motion.div>
      </CustomScroll>
    </div>
  );
};
