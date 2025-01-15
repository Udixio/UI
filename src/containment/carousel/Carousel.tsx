import React from 'react';
import { carouselHelper, CarouselProps } from './carousel.interface';
import { Item, ItemProps } from './item';

export const Carousel = ({
  variant = 'hero',
  className,
  children,
  ...restProps
}: CarouselProps) => {
  const styles = carouselHelper.getStyles({
    variant,
  });

  const items = React.Children.toArray(children).filter(
    (child) => React.isValidElement(child) && child.type === Item
  );

  return (
    <div className={styles.carousel} {...restProps}>
      {items.map((child, index) => {
        return React.cloneElement(child as React.ReactElement<ItemProps>, {
          isExpanded: index < 3,
          key: index,
        });
      })}
    </div>
  );
};
