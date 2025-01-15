import React from 'react';
import { carouselHelper, CarouselProps } from './carousel.interface';

export const Carousel = ({
  variant = 'hero',
  className,
  children,
  ...restProps
}: CarouselProps) => {
  const styles = carouselHelper.getStyles({
    variant,
  });

  return (
    <div className={styles.carousel} {...restProps}>
      {children}
    </div>
  );
};
