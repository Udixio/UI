import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { CarouselInterface, CarouselItemInterface } from '../interfaces';

import { carouselStyle } from '../styles';
import { CustomScroll } from '../effects';
import { ReactProps } from '../utils';
import { CarouselItem, normalize } from './CarouselItem';

/**
 * Carousels show a collection of items that can be scrolled on and off the screen
 * Resources
 * @status beta
 * @category Layout
 */
export const Carousel = ({
  variant = 'hero',
  className,
  children,
  ref: optionalRef,
  marginPourcent = 0,
  inputRange = [0.21, 0.65],
  outputRange = [42, 300],
  gap = 8,
  onChange,
  index,
  scrollSensitivity = 1.25,
  ...restProps
}: ReactProps<CarouselInterface>) => {
  const defaultRef = useRef(null);
  const ref = optionalRef || defaultRef;

  const styles = carouselStyle({
    index,
    className,
    children,
    variant,
    inputRange,
    outputRange,
    marginPourcent,
    onChange,
    gap,
    scrollSensitivity,
  });

  const items = React.Children.toArray(children).filter(
    (child) => React.isValidElement(child) && child.type === CarouselItem,
  );

  const trackRef = useRef<HTMLDivElement>(null);
  const [itemsWidth, setItemsWidth] = useState<Record<number, number | null>>(
    {},
  );
  const [scroll, setScroll] = useState<{
    scrollProgress: number;
    scrollTotal: number;
    scrollVisible: number;
    scroll: number;
  } | null>(null);
  const calculatePercentages = () => {
    if (
      !trackRef.current ||
      !ref.current ||
      scroll?.scrollProgress === undefined
    )
      return [];

    const scrollVisible =
      scroll?.scrollVisible ?? (ref.current as any)?.clientWidth ?? 0;
    // const scrollProgress = scrollMV.get();

    function assignRelativeIndexes(
      values: number[],
      progressScroll: number,
    ): {
      itemScrollXCenter: number;
      relativeIndex: number;
      index: number;
      width: number | null;
    }[] {
      return values.map((value, index) => ({
        itemScrollXCenter: value,
        relativeIndex:
          (value - progressScroll) / Math.abs(values[1] - values[0]),
        index: index,
        width: null,
      }));
    }

    const itemsScrollXCenter = items.map((_, index) => {
      const itemRef = itemRefs[index];

      if (!itemRef.current || !trackRef.current) return 0;

      const itemScrollXCenter = index / (items.length - 1);

      return normalize(itemScrollXCenter, [0, 1], [0, 1]);
    });

    const itemValues = assignRelativeIndexes(
      itemsScrollXCenter,
      scroll?.scrollProgress ?? 0,
    );
    // const visible =
    //   ((ref.current?.clientWidth ?? scrollVisible) - (outputRange[0] + gap)) /
    //   (outputRange[1] + gap);

    let visible =
      ((ref.current?.clientWidth ?? scrollVisible) + gap) /
      (outputRange[1] + gap);

    const widthContent = 0;

    let selectedItem;

    const visibleItemValues = itemValues
      .sort((a, b) => Math.abs(a.relativeIndex) - Math.abs(b.relativeIndex))
      .map((item, index) => {
        if (!item) return;

        if (index === 0) {
          setSelectedItem(item.index);
          selectedItem = item;
        }

        if (visible < 0) {
          item.width = 0;
          return;
        }

        const el = itemRefs[item.index]?.current;
        if (!ref.current || !el) return;

        // const remainingWidth = (ref.current.clientWidth - widthContent) / 2;

        // const elRect = el.getBoundingClientRect();
        // const containerRect = ref.current.getBoundingClientRect();
        // const visibleWidth =
        //   Math.min(elRect.right, containerRect.right) -
        //   Math.max(elRect.left, containerRect.left);
        // const percentVisibleX = visibleWidth / el.offsetWidth;

        if (visible <= 0) {
          item.width = outputRange[0];
        } else {
          item.width = outputRange[1];
        }

        --visible;
        return item;
      })
      .filter(Boolean)
      .sort((a, b) => a.index - b.index) as {
      itemScrollXCenter: number;
      relativeIndex: number;
      index: number;
      width: number | null;
    }[];

    visible += 2;

    const dynamicItems = visibleItemValues.filter(
      (_, index, array) => index === 0 || index === array.length - 1,
    );

    let dynamicWidth = 0;

    dynamicItems.forEach((item) => {
      if (!item) return;

      const result = normalize(
        1 - Math.abs(scroll.scrollProgress - item.itemScrollXCenter),
        [0, 1],
        [0, 1],
      );
      item.width = result;
      dynamicWidth += result;
    });

    dynamicItems.forEach((item, index) => {
      if (!item) return;

      if (index == 0) {
        let relative = selectedItem?.relativeIndex * 2;
        if (relative >= 0) relative = 1 - relative;

        const percent = normalize(item?.relativeIndex, [-2, -1], [0, 1]);
        console.log(index, percent, relative, item?.relativeIndex);

        item.width = normalize(percent, [0, 1], [0, visible * outputRange[1]]);
      } else {
        console.log('itemIndex', item);
        item.width = null;
      }

      // console.log(item, dynamicWidth, visible, selectedItem);

      // item.width = normalize(
      //   item.width / dynamicWidth,
      //   [0, 1],
      //   [0, visible * outputRange[1]],
      // );
    });

    return Object.fromEntries(
      visibleItemValues.map((item) => [item.index, item.width]),
    );
  };
  const itemRefs = useRef<React.RefObject<HTMLDivElement | null>[]>([]).current;
  const [selectedItem, setSelectedItem] = useState(0);

  useEffect(() => {
    if (onChange) onChange(selectedItem);
  }, [selectedItem]);

  // Sync controlled index prop to internal state/position
  useEffect(() => {
    if (
      typeof index === 'number' &&
      items.length > 0 &&
      index !== selectedItem
    ) {
      // centerOnIndex(index);
    }
  }, [index, items.length]);

  // keep focused index aligned with selected when selection changes through scroll
  useEffect(() => {
    setFocusedIndex(selectedItem);
  }, [selectedItem]);

  if (itemRefs.length !== items.length) {
    items.forEach((_, i) => {
      if (!itemRefs[i]) {
        itemRefs[i] = React.createRef<HTMLDivElement>(); // Crée une nouvelle ref si manquante
      }
    });
  }

  // accessibility and interaction states
  const [focusedIndex, setFocusedIndex] = useState(0);

  // const centerOnIndex = (index: number, opts: { animate?: boolean } = {}) => {
  //   if (!items.length) return;
  //   const clamped = Math.max(0, Math.min(index, items.length - 1));
  //   const targetProgress = items.length > 1 ? clamped / (items.length - 1) : 0;
  //   if (opts.animate !== false) {
  //     motionAnimate(scrollMV, targetProgress, {
  //       duration: 0.5,
  //       ease: 'easeOut',
  //     });
  //   } else {
  //     scrollMV.set(targetProgress);
  //   }
  //   setSelectedItem(clamped);
  //   setFocusedIndex(clamped);
  //   // Focus the item for accessibility
  //   const el = itemRefs[clamped]?.current;
  //   if (el && typeof (el as any).focus === 'function') {
  //     (el as any).focus();
  //   }
  // };

  const renderItems = items.map((child, index) => {
    const existingOnClick = (child as any).props?.onClick as
      | ((e: any) => void)
      | undefined;
    const handleClick = (e: any) => {
      existingOnClick?.(e);
      // centerOnIndex(index);
    };
    const handleFocus = () => setFocusedIndex(index);

    return React.cloneElement(
      child as React.ReactElement<ReactProps<CarouselItemInterface>>,
      {
        width: itemsWidth[index],
        outputRange,
        ref: itemRefs[index],
        key: index,
        index,
        role: 'option',
        'aria-selected': selectedItem === index,
        tabIndex: selectedItem === index ? 0 : -1,
        onClick: handleClick,
        onFocus: handleFocus,
      } as any,
    );
  });

  // persistent motion value for scroll progress, driven by user scroll and programmatic centering
  // const scrollMVRef = useRef(motionValue(0));
  // const scrollMV = scrollMVRef.current;

  // const transform = useTransform(
  //   scrollMV,
  //   [0, 1],
  //   [
  //     0,
  //     1 -
  //       (ref.current?.clientWidth ?? 0) / (trackRef?.current?.clientWidth ?? 0),
  //   ],
  // );

  // const percentTransform = useTransform(
  //   transform,
  //   (value) => `${-value * 100}%`,
  // );

  const handleScroll = (args: {
    scrollProgress: number;
    scrollTotal: number;
    scrollVisible: number;
    scroll: number;
  }) => {
    if (args.scrollTotal > 0) {
      // update both MV (visual position) and raw scroll info
      // scrollMV.set(args.scrollProgress);
      setScroll(args);
    }
  };

  useEffect(() => {
    const updatedPercentages = calculatePercentages();
    setItemsWidth(updatedPercentages);
  }, [scroll]);

  // // Recalculate on scrollMV changes (e.g., programmatic animations)
  // useEffect(() => {
  //   const unsubscribe = scrollMV.on('change', (p) => {
  //     // Keep CustomScroll container in sync by dispatching a bubbling control event
  //     const track = trackRef.current as HTMLElement | null;
  //     if (track) {
  //       track.dispatchEvent(
  //         new CustomEvent('udx:customScroll:set', {
  //           bubbles: true,
  //           detail: { progress: p, orientation: 'horizontal' },
  //         }),
  //       );
  //     }
  //     const updated = calculatePercentages();
  //     if (updated.length) setItemsWidth(updated);
  //   });
  //   return () => unsubscribe();
  // }, [scrollMV, trackRef]);

  // Initial compute on mount and when items count changes
  // useLayoutEffect(() => {
  //   const updated = calculatePercentages();
  //   if (updated.length) setItemsWidth(updated);
  // }, [items.length]);

  const [scrollSize, setScrollSize] = useState(0);
  useLayoutEffect(() => {
    let maxWidth = outputRange[1];
    if (scroll && maxWidth > scroll.scrollVisible) {
      maxWidth = scroll.scrollVisible;
    }
    const result = ((maxWidth + gap) * renderItems.length) / scrollSensitivity;
    setScrollSize(result);
  }, [ref, itemRefs, scroll]);

  // Recompute sizes on container/track resize
  // useEffect(() => {
  //   const root = ref.current as unknown as HTMLElement | null;
  //   const track = trackRef.current as unknown as HTMLElement | null;
  //   if (!root || !track) return;
  //   const ro = new ResizeObserver(() => {
  //     const updated = calculatePercentages();
  //     if (updated.length) setItemsWidth(updated);
  //     let maxWidth = outputRange[1];
  //     const visible = scroll?.scrollVisible ?? root.clientWidth;
  //     if (maxWidth > visible) maxWidth = visible;
  //     const result =
  //       ((maxWidth + gap) * renderItems.length) / scrollSensitivity;
  //     setScrollSize(result);
  //   });
  //   ro.observe(root);
  //   ro.observe(track);
  //   return () => ro.disconnect();
  // }, [
  //   ref,
  //   trackRef,
  //   renderItems.length,
  //   gap,
  //   outputRange,
  //   scrollSensitivity,
  //   scroll,
  // ]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!items.length) return;
    const idx = focusedIndex ?? selectedItem;
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        centerOnIndex(Math.max(0, idx - 1));
        break;
      case 'ArrowRight':
        e.preventDefault();
        centerOnIndex(Math.min(items.length - 1, idx + 1));
        break;
      case 'Home':
        e.preventDefault();
        centerOnIndex(0);
        break;
      case 'End':
        e.preventDefault();
        centerOnIndex(items.length - 1);
        break;
      case 'Enter':
      case ' ': // Space
        e.preventDefault();
        centerOnIndex(idx);
        break;
    }
  };

  // External control via CustomEvent on root element
  useEffect(() => {
    const root = ref.current as any;
    if (!root) return;
    const handler = (ev: Event) => {
      const detail = (ev as CustomEvent).detail as
        | { index?: number }
        | undefined;
      if (detail && typeof detail.index === 'number') {
        centerOnIndex(detail.index);
      }
    };
    root.addEventListener('udx:carousel:centerIndex', handler as EventListener);
    return () => {
      root.removeEventListener(
        'udx:carousel:centerIndex',
        handler as EventListener,
      );
    };
  }, [ref, items.length]);

  const translateX = normalize(
    scroll?.scrollProgress ?? 0,
    [0, 1],
    [0, -((trackRef.current?.scrollWidth ?? 0) - (scroll?.scrollVisible ?? 0))],
  );

  return (
    <div
      className={styles.carousel}
      ref={ref}
      role="listbox"
      aria-orientation="horizontal"
      onKeyDown={handleKeyDown}
      {...restProps}
    >
      <CustomScroll
        draggable
        orientation={'horizontal'}
        onScroll={handleScroll}
        scrollSize={scrollSize}
      >
        <div
          className={styles.track}
          ref={trackRef}
          style={{
            transitionDuration: '0.5s',
            transitionTimingFunction: 'ease-out',
            gap: `${gap}px`,
            // translate: translateX,
            willChange: 'translate',
          }}
        >
          {renderItems}
        </div>
      </CustomScroll>
    </div>
  );
};
