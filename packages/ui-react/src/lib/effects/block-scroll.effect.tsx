import React, { useEffect, useRef } from 'react';

type ScrollIntent =
  | {
      type: 'intent';
      source: 'wheel' | 'touch' | 'keyboard';
      deltaX: number;
      deltaY: number;
      originalEvent: Event;
    }
  | {
      type: 'scrollbar';
      scrollTop: number;
      scrollLeft: number;
      maxScrollTop: number;
      maxScrollLeft: number;
    };

type BlockScrollProps = {
  onScroll?: (evt: ScrollIntent) => void; // log des intentions + du scroll via scrollbar
  touch?: boolean;
  el: HTMLElement;
};

export const BlockScroll: React.FC<BlockScrollProps> = ({
  onScroll,
  el,
  touch = true,
}) => {
  const lastTouch = useRef<{ x: number; y: number } | null>(null);
  const lastScrollTop = useRef<number>(0);
  const lastScrollLeft = useRef<number>(0);

  useEffect(() => {
    if (!el) return;

    // Initialize last known scroll positions to block scrollbar-based scrolling
    lastScrollTop.current = el.scrollTop;
    lastScrollLeft.current = el.scrollLeft;

    const emitIntent = (payload: Extract<ScrollIntent, { type: 'intent' }>) => {
      // Log the desired deltaY for every scroll attempt (wheel/touch/keyboard)
      onScroll?.(payload);
    };

    const findScrollableParent = (
      node: HTMLElement | null,
    ): HTMLElement | null => {
      let elNode: HTMLElement | null = node;
      while (
        elNode &&
        elNode !== document.body &&
        elNode !== document.documentElement
      ) {
        const style = window.getComputedStyle(elNode);
        const overflowY = style.overflowY || style.overflow;
        const isScrollableY =
          (overflowY === 'auto' || overflowY === 'scroll') &&
          elNode.scrollHeight > elNode.clientHeight;
        if (isScrollableY) return elNode;
        elNode = elNode.parentElement;
      }
      return null;
    };

    const onWheel = (e: WheelEvent) => {
      // Auto-detect closest scrollable ancestor and allow native scroll when it can handle the intent
      const target = e.target as HTMLElement | null;

      const scrollableParent = findScrollableParent(target);

      if (scrollableParent && scrollableParent !== el) {
        const canScrollDown =
          scrollableParent.scrollTop <
          scrollableParent.scrollHeight - scrollableParent.clientHeight;
        const canScrollUp = scrollableParent.scrollTop > 0;

        // Wheel: positive deltaY => scroll down, negative => scroll up
        if ((e.deltaY > 0 && canScrollDown) || (e.deltaY < 0 && canScrollUp)) {
          // Let the native scrolling happen inside the scrollable element
          return;
        }
      }

      // Otherwise, block native scroll and emit intent for global smooth scroll
      e.preventDefault();
      emitIntent({
        type: 'intent',
        source: 'wheel',
        deltaX: e.deltaX,
        deltaY: e.deltaY,
        originalEvent: e,
      });
    };

    const onTouchStart = (e: TouchEvent) => {
      if (!touch) return;
      const t = e.touches[0];
      if (t) lastTouch.current = { x: t.clientX, y: t.clientY };
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!touch) return;
      const t = e.touches[0];
      if (!t || !lastTouch.current) return;

      const dx = lastTouch.current.x - t.clientX;
      const dy = lastTouch.current.y - t.clientY;

      // Auto-detect closest scrollable ancestor for touch and allow native scroll when possible
      const target = e.target as HTMLElement | null;

      const scrollableParent = findScrollableParent(target);

      if (scrollableParent && scrollableParent !== el) {
        const canScrollDown =
          scrollableParent.scrollTop <
          scrollableParent.scrollHeight - scrollableParent.clientHeight;
        const canScrollUp = scrollableParent.scrollTop > 0;

        // Touch: dy > 0 means user moves finger up -> intent to scroll down
        if ((dy > 0 && canScrollDown) || (dy < 0 && canScrollUp)) {
          // Update last touch and allow native scroll inside the element
          lastTouch.current = { x: t.clientX, y: t.clientY };
          return;
        }
      }

      // Otherwise block and emit intent for global smooth scroll
      e.preventDefault();
      lastTouch.current = { x: t.clientX, y: t.clientY };
      emitIntent({
        type: 'intent',
        source: 'touch',
        deltaX: dx,
        deltaY: dy,
        originalEvent: e,
      });
    };

    const onTouchEnd = () => {
      if (!touch) return;
      lastTouch.current = null;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const line = 40;
      const page = el.clientHeight * 0.9;
      let dx = 0,
        dy = 0;

      switch (e.key) {
        case 'ArrowDown':
          dy = line;
          break;
        case 'ArrowUp':
          dy = -line;
          break;
        case 'ArrowRight':
          dx = line;
          break;
        case 'ArrowLeft':
          dx = -line;
          break;
        case 'PageDown':
          dy = page;
          break;
        case 'PageUp':
          dy = -page;
          break;
        case 'Home':
          dy = Number.NEGATIVE_INFINITY;
          break;
        case 'End':
          dy = Number.POSITIVE_INFINITY;
          break;
        case ' ':
          dy = e.shiftKey ? -page : page;
          break;
        default:
          return;
      }
      e.preventDefault();
      emitIntent({
        type: 'intent',
        source: 'keyboard',
        deltaX: dx,
        deltaY: dy,
        originalEvent: e,
      });
    };

    // const onScrollEvent = (e) => {
    //   const currentScrollTop = e.target.scrollTop;
    //   const currentScrollLeft = e.target.scrollLeft;
    //
    //   // Check if scroll position changed from last known position
    //   if (
    //     currentScrollTop !== lastScrollTop.current ||
    //     currentScrollLeft !== lastScrollLeft.current
    //   ) {
    //     console.log('onScrollllllllllll', e, document);
    //     onScroll?.({
    //       type: 'scrollbar',
    //       scrollTop: currentScrollTop,
    //       scrollLeft: currentScrollLeft,
    //       maxScrollTop: e.target.scrollHeight - e.target.clientHeight,
    //       maxScrollLeft: e.target.scrollWidth - e.target.clientWidth,
    //     });
    //   }
    //
    //   // Update last known scroll positions
    //   lastScrollTop.current = currentScrollTop;
    //   lastScrollLeft.current = currentScrollLeft;
    //
    //   document.querySelector('html')?.scrollTo({ top: 0 });
    // };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('keydown', onKeyDown);
    // el.addEventListener('scroll', onScrollEvent, { passive: true });

    return () => {
      el.removeEventListener('wheel', onWheel as EventListener);
      el.removeEventListener('touchstart', onTouchStart as EventListener);
      el.removeEventListener('touchmove', onTouchMove as EventListener);
      el.removeEventListener('touchend', onTouchEnd as EventListener);
      el.removeEventListener('keydown', onKeyDown as EventListener);
      // el.removeEventListener('scroll', onScrollEvent as EventListener);
    };
  }, [onScroll]);
};
