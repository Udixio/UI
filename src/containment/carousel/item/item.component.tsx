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

  const visibility = useMotionValue(initialVisibility);

  useEffect(() => {
    if (visibilityPercentage !== undefined) {
      visibility.set(visibilityPercentage);
    }
  }, [visibilityPercentage, visibility]);

  const flexBasis = useTransform(visibility, [0.1, 0.5], ['15%', '30%']);

  return (
    <motion.div
      style={{
        // opacity,
        flexBasis,
      }}
      className={styles.item}
      {...restProps}
    >
      {children}
      {/*<p*/}
      {/*  className={*/}
      {/*    'text-display-large absolute text-on-surface bg-surface -translate-x-1/2 left-1/2 top-1/2'*/}
      {/*  }*/}
      {/*>*/}
      {/*  {Math.round(visibilityPercentage * 100)}*/}
      {/*</p>*/}
    </motion.div>
  );
};
