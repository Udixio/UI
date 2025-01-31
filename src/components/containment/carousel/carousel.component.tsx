import React, { useEffect, useRef, useState } from 'react';
import { CarouselProps } from './carousel.interface';
import { CarouselItem, ItemProps } from './item';
import { useMotionValueEvent, useScroll } from 'framer-motion';

import { carouselStyle } from './carousel-style';

export const CarouselComponent = ({
  variant = 'hero',
  height = '400px',
  className,
  children,
  ref: optionalRef,
  marginPourcent = 0.2,
  inputRange = [0.21, 0.65],
  outputRange = [0.1, 1 / 3],
  ...restProps
}: CarouselProps) => {
  const ref = optionalRef || useRef(null);

  const styles = carouselStyle({
    className,
    children,
    variant,
    height,
    inputRange,
    outputRange,
    marginPourcent,
  });

  const items = React.Children.toArray(children).filter(
    (child) => React.isValidElement(child) && child.type === CarouselItem
  );

  const trackRef = useRef<HTMLDivElement>(null);
  const [visibilityPercentages, setVisibilityPercentages] = useState<number[]>(
    []
  );

  const { scrollXProgress } = useScroll({
    container: ref,
  });

  const calculatePercentages = (scrollXProgressValue: number) => {
    if (!trackRef.current || !ref.current) return [];

    const trackRect = trackRef.current.getBoundingClientRect();

    return items.map((_, index) => {
      const itemRef = itemRefs[index];

      if (!itemRef.current || !trackRef.current) return 0;

      let itemScrollXCenter =
        itemRef.current.offsetLeft /
        (trackRef.current.scrollWidth - itemRef.current.offsetWidth);

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

      const scrollLeft = ref.current?.scrollLeft!;
      const scrollWidth = ref.current?.scrollWidth!;
      const scrollRight = scrollWidth - scrollLeft! - ref.current?.clientWidth!;

      const trackInvisiblePourcent =
        ((isOnLeft ? scrollLeft : scrollRight) -
          marginPourcent * trackRect.width) /
        scrollWidth /
        (isOnLeft ? scrollXProgressValue : 1 - scrollXProgressValue);

      return (
        (itemXPourcent - trackInvisiblePourcent) / (1 - trackInvisiblePourcent)
      );
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

  useMotionValueEvent(scrollXProgress, 'change', (latestValue) => {
    const updatedPercentages = calculatePercentages(latestValue);

    setVisibilityPercentages(updatedPercentages);
  });

  useEffect(() => {
    const updatedPercentages = calculatePercentages(0);
    setVisibilityPercentages(updatedPercentages);
  }, []);

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

  return (
    <div
      style={{ height }}
      className={styles.carousel}
      ref={ref}
      {...restProps}
    >
      <div className={styles.track} ref={trackRef}>
        {renderItems}
      </div>
    </div>
  );
};
