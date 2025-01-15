import React from 'react';
import { carouselHelper, CarouselProps } from './carousel.interface';

export const Carousel = ({
  variant = 'hero',
  className,
  ...restProps
}: CarouselProps) => {
  const styles = carouselHelper.getStyles({
    variant,
  });

  return <div className={styles.carousel} {...restProps}></div>;
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
