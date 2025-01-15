import React from 'react';
import { carouselHelper, ItemProps } from './item.interface';

export const Item = ({
  isExpanded,
  className,
  children,
  ...restProps
}: ItemProps) => {
  const styles = carouselHelper.getStyles({
    isExpanded,
  });

  return (
    <div className={styles.item} {...restProps}>
      {children}
    </div>
  );
};
