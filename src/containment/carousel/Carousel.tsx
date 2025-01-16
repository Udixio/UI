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

  const { scrollXProgress } = useScroll({
    container: ref,
  });

  const [expandedIndices, setExpandedIndices] = useState<number[]>([]);

  useMotionValueEvent(scrollXProgress, 'change', (latest) => {
    if (ref.current) {
      const track = ref.current;

      // Dimensions de la piste (track) et des enfants
      const trackRect = track.getBoundingClientRect();
      const itemWidth = trackRect.width / items.length;

      // Position du scroll horizontal
      const scrollPosition = latest * (track.scrollWidth - trackRect.width);

      // Index de l'élément au centre du défilement
      const centeredIndex = Math.round(scrollPosition / itemWidth);

      // Calculer les 3 indices les plus proches
      const closestIndices = [
        centeredIndex - 1,
        centeredIndex,
        centeredIndex + 1,
      ].filter((index) => index >= 0 && index < items.length); // Assurer que les indices sont valides

      setExpandedIndices(closestIndices);
    }
  });

  return (
    <div className={styles.carousel} ref={ref} {...restProps}>
      <div className={styles.track}>
        {items.map((child, index) => {
          return React.cloneElement(child as React.ReactElement<ItemProps>, {
            isExpanded: expandedIndices.includes(index),
            key: index,
          });
        })}
      </div>
    </div>
  );
};
