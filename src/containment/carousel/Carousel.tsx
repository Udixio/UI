import React, { useRef } from 'react';
import { carouselHelper, CarouselProps } from './carousel.interface';
import { Item, ItemProps } from './item';
import { useInView } from 'framer-motion';

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

  // const { scrollXProgress } = useScroll({
  //   container: ref,
  // });

  const trackRef = useRef<HTMLDivElement>(null);

  const renderItems = items.map((child, index) => {
    const itemRef = useRef<HTMLDivElement>(null);

    // Utiliser useInView pour détecter si un élément est visible
    const isInView = useInView(itemRef, {
      margin: '0px 50% 0px 50%', // Détecte l'élément lorsqu'il atteint le centre
      amount: 0.5, // Déclenche lorsque l'élément est visible à 50%
    });

    return React.cloneElement(child as React.ReactElement<ItemProps>, {
      isExpanded: isInView,
      ref: itemRef, // Attacher le ref pour InView
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
