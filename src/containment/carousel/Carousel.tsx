import React, { useState } from 'react';
import { carouselHelper, CarouselProps } from './carousel.interface';

export const Carousel = ({
  variant = 'hero',
  className,
  ...restProps
}: CarouselProps) => {
  const [count, setCount] = useState(0);

  const styles = carouselHelper.getStyles({
    count,
    variant,
    className,
  });

  return (
    <div
      className={styles.carousel}
      onClick={() => setCount(count + 1)}
      {...restProps}
    >
      {variant}
      {count}
    </div>
  );
};

// export const Carousel = new CarouselFactory(
//   ({ variant, count: countProps, ref, ...restProps }) => {
//     const [count, setCount] = useState(countProps);
//
//     return (
//       <div onClick={() => setCount(count + 1)} {...restProps}>
//         {variant}
//         {count}
//       </div>
//     );
//   }
// ).render();
