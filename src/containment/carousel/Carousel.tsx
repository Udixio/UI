import React, { useEffect, useRef, useState } from 'react';
import { carouselHelper, CarouselProps } from './carousel.interface';
import { Item, ItemProps } from './item';
import { useMotionValueEvent, useScroll } from 'framer-motion';

export const Carousel = ({
  variant = 'hero',
  height = '400px',
  className,
  children,
  ref = useRef<HTMLDivElement>(null),
  marginPourcent = 0.2,
  inputRange = [0.21, 0.65],
  outputRange = [0.1, 1 / 3],
  ...restProps
}: CarouselProps) => {
  const styles = carouselHelper.getStyles({
    variant,
    marginPourcent,
  });

  const items = React.Children.toArray(children).filter(
    (child) => React.isValidElement(child) && child.type === Item
  );

  const trackRef = useRef<HTMLDivElement>(null);
  const [visibilityPercentages, setVisibilityPercentages] = useState<number[]>(
    []
  );

  // Hook framer-motion pour détecter le scroll
  const { scrollXProgress } = useScroll({
    container: ref,
  });

  // Fonction de calcul dynamique des pourcentages
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

  // Refs pour chaque item
  const itemRefs = items.map(() => useRef<HTMLDivElement>(null));

  // Mettre à jour les pourcentages à chaque changement de `scrollXProgress`
  useMotionValueEvent(scrollXProgress, 'change', (latestValue) => {
    const updatedPercentages = calculatePercentages(latestValue);

    // console.log(
    //   'somme: ',
    //   updatedPercentages.reduce((sum, value) => sum + value, 0)
    // );
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
