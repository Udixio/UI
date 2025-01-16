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

    const trackRect = trackRef.current.getBoundingClientRect(); // Dimensions du conteneur
    const containerCenterX = trackRect.left + trackRect.width / 2; // Centre du conteneur

    return items.map((_, index) => {
      const itemRef = itemRefs[index];

      if (!itemRef.current) return 0;

      const itemRect = itemRef.current.getBoundingClientRect(); // Dimensions de chaque item
      const itemCenterX = itemRect.left + itemRect.width / 2; // Centre de l’item

      // Ajustement en fonction du scrollXProgress
      const adjustedItemCenterX =
        itemCenterX - trackRect.width * (scrollXProgressValue - 0.5);

      // Distance relative au centre (incluant scrollXProgress)
      const distanceFromCenter = Math.abs(
        containerCenterX - adjustedItemCenterX
      );
      const maxDistance = trackRect.width / 2; // Distance maximale (bord du conteneur)

      // Normalisation en pourcentage
      const percentage = Math.max(
        0,
        100 - (distanceFromCenter / maxDistance) * 100
      );

      // Vérification de visibilité (minimale 50 % selon la demande)
      return percentage > 50 ? percentage : 0;
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
