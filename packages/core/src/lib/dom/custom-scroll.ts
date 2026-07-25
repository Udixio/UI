import { scroll as motionScroll } from 'motion';

export type ScrollOrientation = 'horizontal' | 'vertical';

export interface CustomScrollMetrics {
  /** Scrolled distance in px along the active axis. */
  scroll: number;
  /** Scroll progress, 0..1. */
  scrollProgress: number;
  /** Total scrollable distance in px. */
  scrollTotal: number;
  /** Visible size of the viewport in px along the active axis. */
  scrollVisible: number;
}

export interface CustomScrollDimensions {
  width: number;
  height: number;
}

export interface CustomScrollTarget {
  /** Target progress, 0..1. Takes precedence over `scroll`. */
  progress?: number;
  /** Target scrolled distance in px. */
  scroll?: number;
  orientation?: ScrollOrientation;
}

export interface CustomScrollControllerOptions {
  /** The scrollable viewport element. */
  container: HTMLElement;
  /** The content element (used to measure scroll size). */
  content: HTMLElement;
  orientation?: () => ScrollOrientation;
  /** Overrides the measured scroll size when provided. */
  scrollSize?: () => number | undefined;
  draggable?: () => boolean;
  /** Notification throttle window, in ms. */
  throttleDuration?: number;
  /** Pointer-drag sensitivity multiplier. */
  dragSensitivity?: number;
  /** Called (throttled) with resolved scroll metrics on the active axis. */
  onScroll?: (metrics: CustomScrollMetrics) => void;
  /** Called (throttled) with raw progress on the active axis. */
  onProgress?: (progress: number) => void;
  /** Called when the dragging/scrolling indicator flips. */
  onDraggingChange?: (dragging: boolean) => void;
  /** Called when the viewport size changes. */
  onDimensionsChange?: (dimensions: CustomScrollDimensions) => void;
}

export interface CustomScrollController {
  /** Scroll programmatically to a progress (0..1) or an absolute offset. */
  scrollTo(target: CustomScrollTarget): void;
  /** Emit an initial resting metric (progress 0). */
  notifyInitial(): void;
  destroy(): void;
}

/**
 * Throttle that guarantees the latest call runs after the wait window
 * (leading + trailing). Pure and framework-free.
 */
function createScrollThrottle(
  wait: number,
  fn: (progress: number, axis: 'x' | 'y') => void,
) {
  let lastInvokeTime = 0;
  let trailingTimeout: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: { v: number; o: 'x' | 'y' } | null = null;

  const invoke = (v: number, o: 'x' | 'y') => {
    lastInvokeTime = Date.now();
    fn(v, o);
  };

  const run = (v: number, o: 'x' | 'y') => {
    const now = Date.now();
    const remaining = wait - (now - lastInvokeTime);
    if (remaining <= 0) {
      if (trailingTimeout) {
        clearTimeout(trailingTimeout);
        trailingTimeout = null;
      }
      invoke(v, o);
    } else {
      lastArgs = { v, o };
      if (!trailingTimeout) {
        trailingTimeout = setTimeout(() => {
          trailingTimeout = null;
          const args = lastArgs;
          lastArgs = null;
          if (args) invoke(args.v, args.o);
        }, remaining);
      }
    }
  };

  run.cancel = () => {
    if (trailingTimeout) {
      clearTimeout(trailingTimeout);
      trailingTimeout = null;
    }
  };

  return run;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/**
 * Owns every imperative concern of the CustomScroll effect: the scroll
 * listeners and throttled notifications, pointer dragging, resize observation,
 * and programmatic scrolling (including the `udx:customScroll:set` event).
 *
 * React and Angular adapters render the same DOM structure (scrollable
 * container, sticky content, phantom spacer) and bind this controller to their
 * lifecycle; they own nothing else.
 */
export function createCustomScrollController({
  container,
  content,
  orientation = () => 'vertical',
  scrollSize = () => undefined,
  draggable = () => false,
  throttleDuration = 75,
  dragSensitivity = 1.5,
  onScroll,
  onProgress,
  onDraggingChange,
  onDimensionsChange,
}: CustomScrollControllerOptions): CustomScrollController {
  const lastProgress = { x: 0, y: 0 };

  const contentScrollSize = () => ({
    width: scrollSize() ?? content.scrollWidth,
    height: scrollSize() ?? content.scrollHeight,
  });

  const notify = createScrollThrottle(throttleDuration, (progress, axis) => {
    const ori = orientation();
    const activeAxis = ori === 'horizontal' ? 'x' : 'y';
    if (axis === activeAxis) {
      onProgress?.(progress);
    }
    if (!onScroll) return;

    const scrollSizes = contentScrollSize();
    if (ori === 'horizontal' && axis === 'x') {
      const total = scrollSizes.width - container.clientWidth;
      onScroll({
        scrollProgress: progress,
        scroll: progress * total,
        scrollTotal: total,
        scrollVisible: container.clientWidth,
      });
    } else if (ori === 'vertical' && axis === 'y') {
      const total = scrollSizes.height - container.clientHeight;
      onScroll({
        scrollProgress: progress,
        scroll: progress * total,
        scrollTotal: total,
        scrollVisible: container.clientHeight,
      });
    }
  });

  // --- Scroll progress via Motion's vanilla listener -----------------------
  const stopScrollX = motionScroll(
    (progress: number) => {
      lastProgress.x = progress;
      notify(progress, 'x');
    },
    { axis: 'x', container },
  );
  const stopScrollY = motionScroll(
    (progress: number) => {
      lastProgress.y = progress;
      notify(progress, 'y');
    },
    { axis: 'y', container },
  );

  // --- Dragging indicator + pointer drag -----------------------------------
  let isDragging = false;
  let startX: number | null = 0;
  let scrollLeftStart = 0;
  let scrollFlagTimeout: ReturnType<typeof setTimeout> | null = null;

  const setDragging = (value: boolean) => {
    if (isDragging === value) return;
    isDragging = value;
    onDraggingChange?.(value);
  };

  const onMouseDown = (event: MouseEvent) => {
    setDragging(true);
    startX = event.pageX - container.offsetLeft;
    scrollLeftStart = container.scrollLeft;
  };
  const onMouseMove = (event: MouseEvent) => {
    if (!isDragging || !draggable() || startX == null) return;
    event.preventDefault();
    const x = event.pageX - container.offsetLeft;
    const walk = (x - startX) * dragSensitivity;
    container.scrollLeft = scrollLeftStart - walk;
  };
  const onMouseUp = () => setDragging(false);
  const onDragStart = (event: Event) => event.preventDefault();

  // Native scroll flips the indicator on and resets it after a quiet second.
  const onNativeScroll = () => {
    if (isDragging) return;
    startX = null;
    setDragging(true);
    if (scrollFlagTimeout) clearTimeout(scrollFlagTimeout);
    scrollFlagTimeout = setTimeout(() => setDragging(false), 1000);
  };

  container.addEventListener('mousedown', onMouseDown);
  container.addEventListener('mousemove', onMouseMove);
  container.addEventListener('mouseup', onMouseUp);
  container.addEventListener('mouseleave', onMouseUp);
  container.addEventListener('dragstart', onDragStart);
  container.addEventListener('scroll', onNativeScroll);

  // --- Resize observation --------------------------------------------------
  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      if (entry.target !== container) continue;
      onDimensionsChange?.({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
      if (entry.contentRect.width) notify(lastProgress.x, 'x');
      if (entry.contentRect.height) notify(lastProgress.y, 'y');
    }
  });
  resizeObserver.observe(container);

  // --- Programmatic scrolling ----------------------------------------------
  const scrollTo = (target: CustomScrollTarget) => {
    const ori = target.orientation ?? orientation();
    const sizes = contentScrollSize();
    if (ori === 'horizontal') {
      const total = Math.max(0, sizes.width - container.clientWidth);
      const value =
        typeof target.progress === 'number'
          ? target.progress * total
          : (target.scroll ?? 0);
      container.scrollLeft = clamp(value, 0, total);
    } else {
      const total = Math.max(0, sizes.height - container.clientHeight);
      const value =
        typeof target.progress === 'number'
          ? target.progress * total
          : (target.scroll ?? 0);
      container.scrollTop = clamp(value, 0, total);
    }
  };

  const onExternalSet = (event: Event) => {
    const detail = (event as CustomEvent<CustomScrollTarget>).detail;
    if (detail) scrollTo(detail);
  };
  container.addEventListener('udx:customScroll:set', onExternalSet);

  return {
    scrollTo,
    notifyInitial() {
      if (!onScroll) return;
      const ori = orientation();
      const sizes = contentScrollSize();
      onScroll({
        scrollProgress: 0,
        scroll: 0,
        scrollTotal: ori === 'vertical' ? sizes.height : sizes.width,
        scrollVisible:
          ori === 'vertical'
            ? container.clientHeight
            : container.clientWidth,
      });
    },
    destroy() {
      stopScrollX();
      stopScrollY();
      notify.cancel();
      if (scrollFlagTimeout) clearTimeout(scrollFlagTimeout);
      resizeObserver.disconnect();
      container.removeEventListener('mousedown', onMouseDown);
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('mouseleave', onMouseUp);
      container.removeEventListener('dragstart', onDragStart);
      container.removeEventListener('scroll', onNativeScroll);
      container.removeEventListener('udx:customScroll:set', onExternalSet);
    },
  };
}
