import { useEffect, useRef, useState } from 'react';
import {
  createCustomScrollController,
  type CustomScrollController,
} from '@udixio/core/dom';
import { CustomScrollInterface } from './custom-scroll.interface';
import { customScrollStyle } from './custom-scroll.style';
import { ReactProps } from '@udixio/core';

/**
 * Thin React binding over the shared CustomScroll controller. It renders the DOM
 * structure (scrollable container, sticky content, phantom spacer) and wires the
 * controller to the component lifecycle; all imperative behaviour lives in
 * `@udixio/core/dom`.
 */
export const CustomScroll = ({
  children,
  orientation = 'vertical',
  scrollSize,
  onScroll,
  className,
  draggable = false,
  throttleDuration = 75,
  scroll,
  setScroll,
}: ReactProps<CustomScrollInterface>) => {
  const ref = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<CustomScrollController | null>(null);

  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  }>({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // The controller reads props through accessors so it never needs recreating.
  const orientationRef = useRef(orientation);
  orientationRef.current = orientation;
  const scrollSizeRef = useRef(scrollSize);
  scrollSizeRef.current = scrollSize;
  const draggableRef = useRef(draggable);
  draggableRef.current = draggable;
  const onScrollRef = useRef(onScroll);
  onScrollRef.current = onScroll;
  const setScrollRef = useRef(setScroll);
  setScrollRef.current = setScroll;

  useEffect(() => {
    const container = ref.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const controller = createCustomScrollController({
      container,
      content,
      orientation: () => orientationRef.current,
      scrollSize: () => scrollSizeRef.current,
      draggable: () => draggableRef.current,
      throttleDuration,
      onScroll: (metrics) => onScrollRef.current?.(metrics),
      onProgress: (progress) => setScrollRef.current?.(progress),
      onDraggingChange: setIsDragging,
      onDimensionsChange: setDimensions,
    });

    controllerRef.current = controller;
    controller.notifyInitial();

    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
  }, [throttleDuration]);

  // Reflect a controlled scroll percentage onto the DOM when provided.
  useEffect(() => {
    if (typeof scroll !== 'number') return;
    controllerRef.current?.scrollTo({ progress: scroll, orientation });
  }, [scroll, orientation]);

  const styles = customScrollStyle({
    isDragging,
    children,
    className,
    onScroll,
    orientation,
    scrollSize,
    draggable,
    throttleDuration,
  });

  const isVertical = orientation === 'vertical';
  const containerExtent = isVertical ? dimensions.height : dimensions.width;
  const contentExtent = isVertical
    ? (scrollSize ?? contentRef.current?.scrollHeight ?? 0)
    : (scrollSize ?? contentRef.current?.scrollWidth ?? 0);
  const spacer = Math.max(0, contentExtent - containerExtent);

  return (
    <div className={styles.customScroll} ref={ref}>
      <div
        ref={contentRef}
        style={isVertical ? { height: containerExtent || '100%' } : { width: containerExtent || '100%' }}
        className={styles.track}
      >
        {children}
      </div>

      {spacer > 0 && (
        <div
          className={'flex-none'}
          style={isVertical ? { height: spacer } : { width: spacer }}
        />
      )}
    </div>
  );
};
