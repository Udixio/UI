import React, { useEffect } from 'react';
import { carouselHelper, ItemProps } from './item.interface';
import { motion, useMotionValue, useTransform } from 'framer-motion';

export const Item = ({
  className,
  children,
  visibilityPercentage,
  ...restProps
}: ItemProps) => {
  const isExpanded = visibilityPercentage >= 20;
  const styles = carouselHelper.getStyles({
    isExpanded,
    visibilityPercentage,
  });

  const initialVisibility = visibilityPercentage ?? 0;

  // MotionValue pour suivre visibilityPercentage
  const visibility = useMotionValue(initialVisibility);

  // Mettre à jour automatiquement la MotionValue si percentage change
  useEffect(() => {
    if (visibilityPercentage !== undefined) {
      visibility.set(visibilityPercentage); // Synchroniser avec la prop
    }
  }, [visibilityPercentage, visibility]);

  // Calculer l'opacité avec useTransform
  const opacity = useTransform(visibility, [10, 60], [0, 1]);
  return (
    <motion.div
      style={{
        opacity,
      }}
      className={styles.item}
      {...restProps}
    >
      {children}
      <p
        className={
          'text-display-large absolute text-on-surface bg-surface -translate-x-1/2 left-1/2 top-1/2'
        }
      >
        {Math.round(visibilityPercentage)}
      </p>
    </motion.div>
  );
};
