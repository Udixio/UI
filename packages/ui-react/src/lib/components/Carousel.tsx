import React, {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  carouselStyle,
  type CarouselInterface,
  type CarouselItemInterface,
  type ReactProps,
} from '@udixio/core';
import {
  createCarouselController,
  type CarouselController,
} from '@udixio/core/dom';

import { CustomScroll } from '../effects';
import { createUseStyle } from '../utils/create-use-style';
import { CarouselItem, normalize } from './CarouselItem';

export type ReactCarouselProps = ReactProps<CarouselInterface> & {
  children?: ReactNode;
};

export const useCarouselStyle = createUseStyle(carouselStyle);

/**
 * Carousels show a collection of items that can be scrolled on and off the screen
 *
 * @status beta
 * @category Layout
 * @devx
 * - Only `CarouselItem` children are rendered; other children are ignored.
 * - Use `index` for controlled positioning; otherwise relies on internal scroll state.
 * @a11y
 * - The root is a `region` with `aria-roledescription="carousel"`; provide an
 *   accessible name via `aria-label` on the component.
 * - Each item is a `group` with `aria-roledescription="slide"` and an
 *   `aria-label` of the form `"n / total"`.
 * - Roving `tabIndex` keeps a single item in the tab order; Arrow/Home/End move
 *   the selection and center the focused slide.
 * @limitations
 * - Responsive behavior on mobile is not supported.
 * - Only the `hero` variant is implemented. `center-aligned`, `multi-browse`,
 *   `un-contained`, and `full-screen` are reserved in the type for future
 *   Material 3 layout support and currently render as `hero`.
 */
export const Carousel = ({
  variant = 'hero',
  className,
  children,
  ref: optionalRef,
  outputRange = [42, 300],
  gap = 8,
  onChange,
  onMetricsChange,
  index,
  scrollSensitivity = 1.25,
  ...restProps
}: ReactCarouselProps) => {
  const defaultRef = useRef<HTMLDivElement>(null);
  const ref = optionalRef || defaultRef;

  const items = React.Children.toArray(children).filter(
    (child) => React.isValidElement(child) && child.type === CarouselItem,
  );

  const trackRef = useRef<HTMLDivElement>(null);

  // Latest scroll metrics reported by CustomScroll. Kept in a ref so 60fps
  // scrolling never triggers a React re-render.
  const getScrollState = useRef({
    scrollProgress: 0,
    scrollTotal: 0,
    scrollVisible: 0,
    scroll: 0,
  });

  const itemRefs = useRef<React.RefObject<HTMLDivElement | null>[]>([]).current;
  const [selectedItem, setSelectedItem] = useState(0);

  // The controller reads these through accessors, so it always sees the current
  // prop values without being recreated when they change.
  const gapRef = useRef(gap);
  gapRef.current = gap;
  const outputRangeRef = useRef(outputRange);
  outputRangeRef.current = outputRange;

  const controllerRef = useRef<CarouselController | null>(null);

  const styles = useCarouselStyle({
    variant,
    gap,
    scrollSensitivity,
    outputRange,
    index,
    onChange,
    onMetricsChange,
    selectedIndex: selectedItem,
    className,
  });

  if (itemRefs.length !== items.length) {
    itemRefs.length = 0; // reset
    items.forEach((_, i) => {
      itemRefs[i] = React.createRef<HTMLDivElement>();
    });
  }

  // The spring and the DOM writes live in @udixio/core/dom so every framework
  // shares one implementation; React only owns the lifecycle wiring.
  useEffect(() => {
    const root = ref.current;
    const track = trackRef.current;
    if (!root || !track) return;

    const controller = createCarouselController({
      track,
      items: () => itemRefs.map((itemRef) => itemRef.current),
      viewport: () =>
        getScrollState.current.scrollVisible || root.clientWidth || 0,
      gap: () => gapRef.current,
      minItemWidth: () => outputRangeRef.current[0],
      maxItemWidth: () => outputRangeRef.current[1],
      onSelectedIndexChange: setSelectedItem,
    });

    controllerRef.current = controller;
    controller.update();

    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
  }, [ref]);

  useLayoutEffect(() => {
    controllerRef.current?.update();
  }, [items.length, gap, outputRange]);


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
      controllerRef.current?.setProgress(args.scrollProgress ?? 0);
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
    const sProgress = controllerRef.current?.getProgress() ?? 0;
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

  const renderItems = items.map((child, idx) =>
    React.cloneElement(
      child as React.ReactElement<ReactProps<CarouselItemInterface>>,
      {
        outputRange,
        ref: itemRefs[idx],
        key: idx,
        role: 'group',
        'aria-roledescription': 'slide',
        'aria-label': `${idx + 1} / ${items.length}`,
        tabIndex: selectedItem === idx ? 0 : -1,
        onFocus: () => setFocusedIndex(idx),
      } as ReactProps<CarouselItemInterface> & Record<string, unknown>,
    ),
  );

  return (
    <div
      className={styles.carousel}
      ref={ref}
      role="region"
      aria-roledescription="carousel"
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
