import React, { useState } from 'react';
import { CarouselFactory } from './carousel.interface';

// export const Carousel = ({}: PropsExternal &
//   PropsOptional &
//   PropsInternal & {
//   ref?: React.RefObject<HTMLElement>;
// } & HTMLAttributes<HTMLElement>) => {
//   return (
//       <div onClick={() => setCount(count + 1)} {...restProps}>
//         {variant}
//         {count}
//       </div>
//     );
// };

export const Carousel = new CarouselFactory(
  ({ variant, count: countProps, ref, ...restProps }) => {
    const [count, setCount] = useState(countProps);

    return (
      <div onClick={() => setCount(count + 1)} {...restProps}>
        {variant}
        {count}
      </div>
    );
  }
).render();

export type CarouselProps = Parameters<typeof Carousel>[0];
