import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { animate } from 'motion/react';
import { CarouselInterface, CarouselItemInterface } from '../interfaces';

import { carouselStyle } from '../styles';
import { CustomScroll } from '../effects';
import { ReactProps } from '../utils';
import { CarouselItem, normalize } from './CarouselItem';

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

/**
 * Carousels show a collection of items that can be scrolled on and off the screen
 *
 * @status beta
 * @category Layout
 * @limitations
 * - At the end of the scroll, a residual gap/space may remain visible.
 * - In/out behavior is inconsistent at range edges.
 * - Responsive behavior on mobile is not supported.
 * - Only the default (hero) variant is supported.
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
  onMetricsChange,
  index,
  scrollSensitivity = 1.25,
  ...restProps
}: ReactProps<CarouselInterface>) => {
  const defaultRef = useRef(null);
  const ref = optionalRef || defaultRef;

  const [translateX, setTranslateX] = useState(0);

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
    onMetricsChange,
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
  // Smoothed scroll progress using framer-motion animate()
  const smoothedProgressRef = useRef(0);
  const scrollAnimationRef = useRef<ReturnType<typeof animate> | null>(null);

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
      width: number;
    }[] {
      return values.map((value, index) => {
        const relativeIndex =
          (value - progressScroll) / Math.abs(values[1] - values[0]);

        // let relativePercent = relativeIndex - Math.trunc(relativeIndex);
        // if (relativePercent > 0) {
        //   relativePercent = 1 - relativePercent;
        // }

        return {
          itemScrollXCenter: value,
          relativeIndex,
          index: index,
          width: 0,
        };
      });
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
    ).sort((a, b) => a.index - b.index);

    let widthLeft =
      (ref.current?.clientWidth ?? scrollVisible) + gap + outputRange[0] + gap;

    console.log('new', widthLeft);

    const visibleItemValues = itemValues
      .sort((a, b) => Math.abs(a.relativeIndex) - Math.abs(b.relativeIndex))
      .map((item, index) => {
        if (widthLeft <= 0) {
          return undefined;
        }

        item.width = normalize(
          widthLeft - gap,
          [outputRange[0], outputRange[1]],
          [outputRange[0], outputRange[1]],
        );

        widthLeft -= item.width + gap;

        if (widthLeft != 0 && widthLeft < (outputRange[0] + gap) * 2) {
          const newWidth =
            item.width - ((outputRange[0] + gap) * 2 - widthLeft);

          widthLeft += item.width;
          item.width = newWidth;
          widthLeft -= item.width;
        } else if (widthLeft == 0 && item.width >= outputRange[0] * 2 + gap) {
          console.log('ok', item.width);
          const newWidth = item.width - (outputRange[0] + gap - widthLeft);

          widthLeft += item.width;
          item.width = newWidth;
          widthLeft -= item.width;
        }
        console.log('ff', item.index + 1, widthLeft, outputRange[0] + gap);

        return item;
      })
      .filter(Boolean) as unknown as {
      itemScrollXCenter: number;
      relativeIndex: number;
      index: number;
      width: number;
    }[];

    const reverseItemsVisible = visibleItemValues.reverse();
    const itemsVisibleByIndex = [...visibleItemValues].sort(
      (a, b) => Math.abs(a.index) - Math.abs(b.index),
    );

    //dynamic items

    reverseItemsVisible.forEach((item, index) => {
      const nextItem = reverseItemsVisible[index + 1];
      if (!nextItem) return;

      const test =
        1 - (Math.abs(item.relativeIndex) - Math.abs(nextItem?.relativeIndex));

      const newWidth = normalize(
        test,
        [0, 2],
        [item.width + widthLeft, nextItem.width],
      );

      widthLeft += item.width;
      item.width = newWidth;
      widthLeft -= item.width;
    });

    const percentMax = visibleItemValues.length / 2;
    const percent = normalize(
      Math.abs(itemsVisibleByIndex[0].relativeIndex),
      [itemsVisibleByIndex[0].index == 0 ? 0 : percentMax - 1, percentMax],
      [0, 1],
    );

    const translate =
      normalize(percent, [0, 1], [0, 1]) * -(outputRange[0] + gap);
    // widthLeft -= translate / 2;

    console.log('translate', translate);

    setTranslateX(translate);

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
      centerOnIndex(index);
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

  const centerOnIndex = (index: number, opts: { animate?: boolean } = {}) => {
    // Guard: need valid refs and at least one item
    if (!items.length) return 0;
    const itemRef = itemRefs[index];
    if (!itemRef || !itemRef.current || !trackRef.current) return 0;

    // Compute progress (0..1) for the target item center within the track
    const itemScrollXCenter = normalize(
      index / Math.max(1, items.length - 1),
      [0, 1],
      [0, 1],
    );

    // Update selection/focus hint
    setFocusedIndex(index);

    // Ask CustomScroll to move to the computed progress. This will trigger onScroll,
    // which in turn drives the smoothed animation via handleScroll().
    const track = trackRef.current as HTMLElement;
    track.dispatchEvent(
      new CustomEvent('udx:customScroll:set', {
        bubbles: true,
        detail: {
          progress: itemScrollXCenter,
          orientation: 'horizontal',
          animate: opts.animate !== false,
        },
      }),
    );

    return itemScrollXCenter;
  };

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
      // Smooth and inertial transition of scrollProgress using framer-motion animate()
      // Stop any previous animation to avoid stacking
      scrollAnimationRef.current?.stop();
      const from = smoothedProgressRef.current ?? 0;
      const to = args.scrollProgress ?? 0;

      scrollAnimationRef.current = animate(from, to, {
        // Spring tuning to add a bit of inertia and smoothness
        type: 'spring',
        stiffness: 260,
        damping: 32,
        mass: 0.6,
        restDelta: 0.0005,
        onUpdate: (v) => {
          smoothedProgressRef.current = v;
          setScroll({ ...args, scrollProgress: v });
        },
      });
    }
  };

  useEffect(() => {
    const updatedPercentages = calculatePercentages();
    setItemsWidth(updatedPercentages);
  }, [scroll]);

  // Keep latest onMetricsChange in a ref to avoid effect dependency loops
  const onMetricsChangeRef = useRef(onMetricsChange);
  useEffect(() => {
    onMetricsChangeRef.current = onMetricsChange;
  }, [onMetricsChange]);

  // Cache last emitted metrics to prevent redundant calls
  const lastMetricsRef = useRef<any>(null);

  // Compute and emit live metrics for external control
  useEffect(() => {
    const cb = onMetricsChangeRef.current;
    if (!cb) return;
    if (!ref?.current) return;
    const total = items.length;
    if (total <= 0) return;
    const viewportWidth = (ref.current as any)?.clientWidth ?? 0;
    const itemMaxWidth = outputRange[1];
    const sProgress =
      smoothedProgressRef.current ?? scroll?.scrollProgress ?? 0;
    const visibleApprox = (viewportWidth + gap) / (itemMaxWidth + gap);
    const visibleFull = Math.max(1, Math.floor(visibleApprox));
    const stepHalf = Math.max(1, Math.round(visibleFull * (2 / 3)));
    const selectedIndexSafe = Math.min(
      Math.max(0, selectedItem),
      Math.max(0, total - 1),
    );
    const canPrev = selectedIndexSafe > 0;
    const canNext = selectedIndexSafe < total - 1;

    const metrics = {
      total,
      selectedIndex: selectedIndexSafe,
      visibleApprox,
      visibleFull,
      stepHalf,
      canPrev,
      canNext,
      scrollProgress: sProgress,
      viewportWidth,
      itemMaxWidth,
      gap,
    } as any;

    // Shallow compare with last metrics to avoid spamming parent and loops
    const last = lastMetricsRef.current;
    let changed = !last;
    if (!changed) {
      for (const k in metrics) {
        if (metrics[k] !== last[k]) {
          changed = true;
          break;
        }
      }
    }

    if (changed) {
      lastMetricsRef.current = metrics;
      cb(metrics);
    }
  }, [ref, items.length, selectedItem, scroll, gap, outputRange]);

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

  // Cleanup any pending animation on unmount
  useEffect(() => {
    return () => {
      scrollAnimationRef.current?.stop();
    };
  }, []);

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
            gap: `${gap}px`,
            translate: translateX,
            willChange: 'translate',
          }}
        >
          {renderItems}
        </div>
      </CustomScroll>
    </div>
  );
};
