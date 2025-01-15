import React from 'react';
import { carouselHelper, ItemProps } from './item.interface';

export const ItemComponent = ({ className, ...restProps }: ItemProps) => {
  const styles = carouselHelper.getStyles({});

  return <div className={styles.item} {...restProps}></div>;
};
