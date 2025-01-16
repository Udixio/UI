import React from 'react';
import { carouselHelper, ItemProps } from './item.interface';

export const Item = ({
  className,
  children,
  visibilityPercentage,
  ...restProps
}: ItemProps) => {
  const isExpanded = visibilityPercentage >= 50;
  const styles = carouselHelper.getStyles({
    isExpanded,
    visibilityPercentage,
  });

  return (
    <div className={styles.item} {...restProps}>
      {children}
      <p
        className={
          'text-display-large absolute text-on-surface bg-surface -translate-x-1/2 left-1/2 top-1/2'
        }
      >
        {Math.round(visibilityPercentage)}
      </p>
    </div>
  );
};
