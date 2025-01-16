import React, { useRef, useState } from 'react';
import { carouselHelper, CarouselProps } from './carousel.interface';
import { Item, ItemProps } from './item';
import { useMotionValueEvent, useScroll } from 'framer-motion';

export const Carousel = ({
  variant = 'hero',
  className,
  children,
  ref = useRef<HTMLDivElement>(null),
  ...restProps
}: CarouselProps) => {
  const styles = carouselHelper.getStyles({
    variant,
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
    if (!trackRef.current) return [];

    const trackRect = trackRef.current.getBoundingClientRect();

    return items.map((_, index) => {
      const itemRef = itemRefs[index];

      if (!itemRef.current || !trackRef.current) return 0;

      const itemScrollXCenter =
        itemRef.current.offsetLeft /
        (trackRef.current.scrollWidth - itemRef.current.offsetWidth);

      const absoluteDifference = Math.abs(
        itemScrollXCenter - scrollXProgressValue
      );
      const itemXPourcent = (1 - absoluteDifference) * 100;
      const trackVisiblePourcent =
        (trackRect.width / trackRef.current.scrollWidth) * 100;
      const trackInvisiblePourcent = 100 - trackVisiblePourcent;
      return (
        ((itemXPourcent - trackInvisiblePourcent) /
          (100 - trackInvisiblePourcent)) *
        100
      );
    });
  };

  // Refs pour chaque item
  const itemRefs = items.map(() => useRef<HTMLDivElement>(null));

  // Mettre à jour les pourcentages à chaque changement de `scrollXProgress`
  useMotionValueEvent(scrollXProgress, 'change', (latestValue) => {
    const updatedPercentages = calculatePercentages(latestValue);
    setVisibilityPercentages(updatedPercentages);
  });

  const renderItems = items.map((child, index) => {
    return React.cloneElement(child as React.ReactElement<ItemProps>, {
      visibilityPercentage: visibilityPercentages[index], // Passer la valeur de visibilité calculée
      ref: itemRefs[index],
      key: index,
    });
  });

  return (
    <div className={styles.carousel} ref={ref} {...restProps}>
      <div className={styles.track} ref={trackRef}>
        {renderItems}
      </div>
    </div>
  );
};
