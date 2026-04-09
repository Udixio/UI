import React, { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { animate } from 'motion/react';
import { CarouselInterface, CarouselItemInterface } from '../interfaces';

import { useCarouselStyle } from '../styles';
import { CustomScroll } from '../effects';
import { ReactProps } from '../utils';
import { CarouselItem, normalize } from './CarouselItem';

/**
 * Carousels show a collection of items that can be scrolled on and off the screen
 *
 * @status beta
 * @category Layout
 * @devx
 * - Only `CarouselItem` children are rendered; other children are ignored.
 * - Use `index` for controlled positioning; otherwise relies on internal scroll state.
 * @limitations
 * - Responsive behavior on mobile is not supported.
 * - Only the default (hero) variant is supported.
 * - No keyboard navigation or focus management.
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
  const defaultRef = useRef<HTMLDivElement>(null);
  const ref = optionalRef || defaultRef;

  const styles = useCarouselStyle({
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
  
  // OPTIMIZATION: We no longer store width and translate in React state to avoid laggy 60fps re-renders.
  // We use refs instead.
  const getScrollState = useRef({
    scrollProgress: 0,
    scrollTotal: 0,
    scrollVisible: 0,
    scroll: 0,
  });
  
  // Smoothed scroll progress using framer-motion animate()
  const smoothedProgressRef = useRef(0);
  const scrollAnimationRef = useRef<ReturnType<typeof animate> | null>(null);

  const itemRefs = useRef<React.RefObject<HTMLDivElement | null>[]>([]).current;
  const [selectedItem, setSelectedItem] = useState(0);

  if (itemRefs.length !== items.length) {
    itemRefs.length = 0; // reset
    items.forEach((_, i) => {
      itemRefs[i] = React.createRef<HTMLDivElement>();
    });
  }

  // Pure mathematical logic - kept from original
  const updateLayoutFromCalculations = useCallback(() => {
    if (!trackRef.current || !ref.current) return;
    const currentScrollProgress = smoothedProgressRef.current;
    
    // Need dimensions
    const scrollVisible = getScrollState.current.scrollVisible || (ref.current as any).clientWidth || 0;

    function assignRelativeIndexes(values: number[], progressScroll: number) {
      return values.map((value, idx) => {
        const relativeIndex = (value - progressScroll) / Math.abs(values[1] - values[0]);
        return { itemScrollXCenter: value, relativeIndex, index: idx, width: 0 };
      });
    }

    const itemsScrollXCenter = items.map((_, idx) => {
      // Calculate original center normalized
      const itemScrollXCenter = idx / Math.max(1, items.length - 1);
      return normalize(itemScrollXCenter, [0, 1], [0, 1]);
    });

    const itemValues = assignRelativeIndexes(
      itemsScrollXCenter,
      currentScrollProgress,
    ).sort((a, b) => a.index - b.index);

    let widthLeft = scrollVisible + gap + outputRange[0] + gap;

    let localSelected = selectedItem;
    const visibleItemValues = itemValues
      .sort((a, b) => Math.abs(a.relativeIndex) - Math.abs(b.relativeIndex))
      .map((item, idx) => {
        if (widthLeft <= 0) return undefined;
        if (idx === 0) localSelected = item.index;

        item.width = normalize(
          widthLeft - gap,
          [outputRange[0], outputRange[1]],
          [outputRange[0], outputRange[1]],
        );

        widthLeft -= item.width + gap;

        if (widthLeft !== 0 && widthLeft < (outputRange[0] + gap) * 2) {
          const newWidth = item.width - ((outputRange[0] + gap) * 2 - widthLeft);
          widthLeft += item.width;
          item.width = newWidth;
          widthLeft -= item.width;
        } else if (widthLeft === 0 && item.width >= outputRange[0] * 2 + gap) {
          const newWidth = item.width - (outputRange[0] + gap - widthLeft);
          widthLeft += item.width;
          item.width = newWidth;
          widthLeft -= item.width;
        }
        return item;
      })
      .filter(Boolean) as { itemScrollXCenter: number; relativeIndex: number; index: number; width: number; }[];

    const reverseItemsVisible = [...visibleItemValues].reverse();
    const itemsVisibleByIndex = [...visibleItemValues].sort((a, b) => Math.abs(a.index) - Math.abs(b.index));

    reverseItemsVisible.forEach((item, idx) => {
      const nextItem = reverseItemsVisible[idx + 1];
      if (!nextItem) return;

      const test = 1 - (Math.abs(item.relativeIndex) - Math.abs(nextItem.relativeIndex));
      const newWidth = normalize(test, [0, 2], [item.width + widthLeft, nextItem.width]);

      widthLeft += item.width;
      item.width = newWidth;
      widthLeft -= item.width;
    });

    const percentMax = visibleItemValues.length / 2;
    const percent = normalize(
      Math.abs(itemsVisibleByIndex[0].relativeIndex),
      [itemsVisibleByIndex[0].index === 0 ? 0 : percentMax - 1, percentMax],
      [0, 1],
    );

    const translate = normalize(percent, [0, 1], [0, 1]) * -(outputRange[0] + gap);

    // ===================================
    // DOM INJECTION OPTIMIZATION
    // ===================================
    
    // Apply width to each visible item using DOM instead of setItemWidths React state
    // First, fallback everything to outputRange[0] (or hide them)
    itemRefs.forEach((refItem, i) => {
      if (refItem.current) {
        const match = visibleItemValues.find(v => v.index === i);
        if (match) {
           refItem.current.style.setProperty('--carousel-item-width', `${match.width}px`);
           refItem.current.style.display = 'block';
        } else {
           refItem.current.style.setProperty('--carousel-item-width', `${outputRange[0]}px`);
           refItem.current.style.display = 'none';
        }
      }
    });

    // Apply track translate directly via DOM
    trackRef.current.style.transform = `translateX(${translate}px)`;

    if (localSelected !== selectedItem) {
      setSelectedItem(localSelected);
    }
  }, [items.length, outputRange, gap, selectedItem]);

  useLayoutEffect(() => {
    updateLayoutFromCalculations();
  }, [updateLayoutFromCalculations, items.length]);


  useEffect(() => {
    if (onChange) onChange(selectedItem);
  }, [selectedItem, onChange]);

  // accessibility and interaction states
  const [focusedIndex, setFocusedIndex] = useState(0);

  useEffect(() => {
    setFocusedIndex(selectedItem);
  }, [selectedItem]);


  const centerOnIndex = (idx: number, opts: { animate?: boolean } = {}) => {
    if (!items.length) return 0;
    const itemRef = itemRefs[idx];
    if (!itemRef || !itemRef.current || !trackRef.current) return 0;

    const itemScrollXCenter = normalize(
      idx / Math.max(1, items.length - 1),
      [0, 1],
      [0, 1],
    );

    setFocusedIndex(idx);

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

  useEffect(() => {
    if (typeof index === 'number' && items.length > 0 && index !== selectedItem) {
      centerOnIndex(index);
    }
  }, [index, items.length]);

  const handleScroll = (args: {
    scrollProgress: number;
    scrollTotal: number;
    scrollVisible: number;
    scroll: number;
  }) => {
    getScrollState.current = args;

    if (args.scrollTotal > 0) {
      scrollAnimationRef.current?.stop();
      const from = smoothedProgressRef.current ?? 0;
      const to = args.scrollProgress ?? 0;

      scrollAnimationRef.current = animate(from, to, {
        type: 'spring',
        stiffness: 260,
        damping: 32,
        mass: 0.6,
        restDelta: 0.0005,
        onUpdate: (v) => {
          smoothedProgressRef.current = v;
          requestAnimationFrame(() => {
              updateLayoutFromCalculations(); // Apply DOM updates synchronously to animation
          });
        },
      });
    }
  };

  // Keep latest onMetricsChange in a ref to avoid effect dependency loops
  const onMetricsChangeRef = useRef(onMetricsChange);
  useEffect(() => {
    onMetricsChangeRef.current = onMetricsChange;
  }, [onMetricsChange]);

  const lastMetricsRef = useRef<any>(null);

  useEffect(() => {
    const cb = onMetricsChangeRef.current;
    if (!cb || !ref?.current || items.length <= 0) return;
    const total = items.length;
    const viewportWidth = (ref.current as any).clientWidth || 0;
    const itemMaxWidth = outputRange[1];
    const sProgress = smoothedProgressRef.current;
    const visibleApprox = (viewportWidth + gap) / (itemMaxWidth + gap);
    const visibleFull = Math.max(1, Math.floor(visibleApprox));
    const stepHalf = Math.max(1, Math.round(visibleFull * (2 / 3)));
    const selectedIndexSafe = Math.min(Math.max(0, selectedItem), Math.max(0, total - 1));

    const metrics = {
      total,
      selectedIndex: selectedIndexSafe,
      visibleApprox,
      visibleFull,
      stepHalf,
      canPrev: selectedIndexSafe > 0,
      canNext: selectedIndexSafe < total - 1,
      scrollProgress: sProgress,
      viewportWidth,
      itemMaxWidth,
      gap,
    };

    const last = lastMetricsRef.current;
    let changed = !last;
    if (!changed) {
      for (const k in metrics) {
        if ((metrics as any)[k] !== last[k]) {
          changed = true;
          break;
        }
      }
    }

    if (changed) {
      lastMetricsRef.current = metrics;
      cb(metrics);
    }
  }, [ref, items.length, selectedItem, gap, outputRange]);

  useEffect(() => {
    return () => {
      scrollAnimationRef.current?.stop();
    };
  }, []);

  const [scrollSize, setScrollSize] = useState(0);
  useLayoutEffect(() => {
    let maxWidth = outputRange[1];
    const scrollState = getScrollState.current;
    if (scrollState && maxWidth > scrollState.scrollVisible && scrollState.scrollVisible > 0) {
      maxWidth = scrollState.scrollVisible;
    }
    const result = ((maxWidth + gap) * items.length) / scrollSensitivity;
    setScrollSize(result || 400); // Fail-safe
  }, [ref, items.length, gap, outputRange, scrollSensitivity]);


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
      case ' ':
        e.preventDefault();
        centerOnIndex(idx);
        break;
    }
  };

  useEffect(() => {
    const root = ref.current as any;
    if (!root) return;
    const handler = (ev: Event) => {
      const detail = (ev as CustomEvent).detail;
      if (detail && typeof detail.index === 'number') {
        centerOnIndex(detail.index);
      }
    };
    root.addEventListener('udx:carousel:centerIndex', handler);
    return () => {
      root.removeEventListener('udx:carousel:centerIndex', handler);
    };
  }, [ref, items.length]);

  const renderItems = items.map((child, idx) => {
    const existingOnClick = (child as any).props?.onClick;
    const handleClick = (e: any) => {
      existingOnClick?.(e);
      // centerOnIndex(idx);
    };

    return React.cloneElement(
      child as React.ReactElement<ReactProps<CarouselItemInterface>>,
      {
        outputRange,
        ref: itemRefs[idx],
        key: idx,
        index: idx,
        role: 'option',
        'aria-selected': selectedItem === idx,
        tabIndex: selectedItem === idx ? 0 : -1,
        onClick: handleClick,
        onFocus: () => setFocusedIndex(idx),
        // NOTE: We REMOVED the 'width' prop from here!
      } as any,
    );
  });

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
            willChange: 'transform',
          }}
        >
          {renderItems}
        </div>
      </CustomScroll>
    </div>
  );
};
