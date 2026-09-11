import React, { useRef, type ReactNode } from 'react';
import {
  carouselItemStyle,
  type CarouselItemInterface,
  type ReactProps,
} from '@udixio/core';
import { createUseStyle } from '../utils/create-use-style';

// CarouselItem renders a plain <div>; it does not use Motion, so its public
// props are the standard element props, not the full motion.div surface.
export type ReactCarouselItemProps = ReactProps<CarouselItemInterface> & {
  children?: ReactNode;
};

export const useCarouselItemStyle = createUseStyle(carouselItemStyle);

/**
 * A single slide inside a `Carousel`. Its width is driven by the carousel's
 * scroll position; it simply projects its children.
 *
 * @status beta
 * @parent Carousel
 * @devx
 * - Intended for use inside `Carousel`, which injects sizing and slide roles.
 * @a11y
 * - Rendered by `Carousel` as a `group` with `aria-roledescription="slide"` and
 *   an `aria-label`; used standalone it is a plain container with no slide role.
 * @limitations
 * - Sizing (`outputRange`) is provided by the parent `Carousel`; used on its own
 *   the item has no min/max width.
 */
export const CarouselItem = ({
  className,
  children,
  outputRange,
  ref: optionalRef,
  ...restProps
}: ReactCarouselItemProps) => {
  const defaultRef = useRef(null);
  const ref: React.RefObject<null | HTMLDivElement> = optionalRef || defaultRef;

  const styles = useCarouselItemStyle({
    outputRange,
    className,
  });

  return (
    <div
      ref={ref}
      style={{
        width: 'var(--carousel-item-width, 100%)',
        maxWidth: outputRange ? outputRange[1] + 'px' : undefined,
        minWidth: outputRange ? outputRange[0] + 'px' : undefined,
      }}
      className={styles.carouselItem}
      {...restProps}
    >
      {children}
    </div>
  );
};
