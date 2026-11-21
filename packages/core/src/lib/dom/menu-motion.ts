import {
  animateStyle,
  composeHandles,
  type CurveTiming,
  type MotionHandle,
  type SpringRef,
} from '@udixio/motion/animate';
import { motionPolicy } from '@udixio/motion/policy';
import { resolveBoxElement } from './anchor-positioner.js';
import { collapseTimingOf } from './component-motion.js';

/** A box in viewport coordinates: a trigger's rect, or a point (left = right, top = bottom) for a context menu. */
export interface MenuAnchorBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** The transform origin of a menu, as fractions of its own width (`x`) and height (`y`). */
export interface MenuTransformOrigin {
  x: number;
  y: number;
}

/**
 * Where a menu grows from, for the side it opened on (Material 3, Compose `calculateTransformOrigin`). On each axis the
 * origin is the menu's edge that faces its anchor when the menu lies wholly past the anchor (0 when it opens after it,
 * 1 when before it), and otherwise the middle of the span the anchor and the menu share, measured in the menu.
 */
export function resolveMenuTransformOrigin(
  anchor: MenuAnchorBox,
  menu: MenuAnchorBox,
): MenuTransformOrigin {
  const pivot = (
    anchorStart: number,
    anchorEnd: number,
    menuStart: number,
    menuEnd: number,
  ) => {
    const size = menuEnd - menuStart;
    if (menuStart >= anchorEnd) return 0;
    if (menuEnd <= anchorStart) return 1;
    if (size <= 0) return 0;
    const shared =
      (Math.max(anchorStart, menuStart) + Math.min(anchorEnd, menuEnd)) / 2;
    return (shared - menuStart) / size;
  };
  return {
    x: pivot(anchor.left, anchor.right, menu.left, menu.right),
    y: pivot(anchor.top, anchor.bottom, menu.top, menu.bottom),
  };
}

/**
 * The layout box of a menu in viewport coordinates, without the scale its motion gives it: a menu measured while it
 * grows or shrinks still reports the place and size it takes at rest. An element with no layout size (outside a
 * browser layout) gives its client rect as it is.
 */
export function measureMenuBox(menu: HTMLElement): MenuAnchorBox & {
  width: number;
  height: number;
} {
  const rect = menu.getBoundingClientRect();
  const width = menu.offsetWidth;
  const height = menu.offsetHeight;
  if (!width || !height) {
    return {
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
    };
  }
  const scaleX = rect.width / width;
  const scaleY = rect.height / height;
  // A point at `o` px from the box's start, scaled by `s` about the origin, lands at `start + o * (1 - s)`.
  const [originX = 0, originY = 0] = (
    menu.ownerDocument.defaultView?.getComputedStyle(menu).transformOrigin ??
    ''
  )
    .split(' ')
    .map((value) => Number.parseFloat(value) || 0);
  const left = rect.left - originX * (1 - scaleX);
  const top = rect.top - originY * (1 - scaleY);
  return { left, top, right: left + width, bottom: top + height, width, height };
}

export interface MenuTransitionOptions {
  /** The menu surface (`role="menu"` or `role="listbox"`): it scales and fades. */
  menu: HTMLElement;
  /**
   * What the menu opens from, read at each open: its trigger, or a function that gives a box (a point for a context
   * menu). The menu grows from the side that faces it. Without an anchor, the menu grows from its top edge.
   */
  anchor?: HTMLElement | (() => MenuAnchorBox | null | undefined);
  /**
   * The motion of the scale as the menu opens; `spring.fast.spatial` by default, as Material 3 menus. The opacity fades
   * on `spring.fast.effects`, and the exit scales on the effects spring of the same speed, so it ends sooner and
   * without a bounce.
   */
  timing?: SpringRef | CurveTiming;
  /** An extra reduced-motion switch, read at each change; the document policy always applies. */
  reducedMotion?: () => boolean;
  /**
   * Called once an exit has ended, when the menu is closed and no longer seen: the adapter hides it (`hidden`) or
   * unmounts it then. Not called for an exit that an open interrupts.
   */
  onExited?: () => void;
}

export interface MenuTransitionController {
  /**
   * Opens or closes the menu. An open measures the menu against its anchor for the origin of the scale, so the adapter
   * calls it once the menu is shown and positioned; called again while open, it measures again (after the position
   * changed) without replaying the motion. A change in the middle of a motion continues from what the menu shows.
   */
  setOpen(open: boolean): void;
  destroy(): void;
}

/** The scale a closed menu shrinks to, and grows from (Material 3, Compose `ClosedScaleTarget`). */
const CLOSED_SCALE = 0.8;
const CLOSED_FRAME = { opacity: 0, transform: `scale(${CLOSED_SCALE})` };
const OPEN_FRAME = { opacity: 1, transform: 'scale(1)' };
/** A menu is a small surface: it grows on the fast spatial spring (Compose `MotionSchemeKeyTokens.FastSpatial`). */
const DEFAULT_TIMING: SpringRef = 'spring.fast.spatial';
/** Its opacity fades on the fast effects spring, without overshoot (Compose `MotionSchemeKeyTokens.FastEffects`). */
const FADE_TIMING: SpringRef = 'spring.fast.effects';

/**
 * The open and close motion of a menu surface, shared by every adapter (`MenuSubmenu`, `ContextMenu`) so React,
 * Angular and Svelte animate identically. Material 3: the surface scales from 0.8 to 1 on the fast spatial spring
 * from the side it opened on, and fades in on the fast effects spring; it leaves faster, scaling back and fading out on
 * the fast effects spring. The menu starts closed (transparent, at its closed scale). Under reduced motion the change
 * applies at once. The adapter owns `hidden`/`inert`: `inert` as the menu closes, `hidden` (or the unmount) once
 * `onExited` runs, so the exit is seen to its end.
 */
export function createMenuTransitionController({
  menu,
  anchor,
  timing = DEFAULT_TIMING,
  reducedMotion = () => false,
  onExited,
}: MenuTransitionOptions): MenuTransitionController {
  let isOpen = false;
  let destroyed = false;
  let current: MotionHandle | undefined;

  const writeFrame = (frame: { opacity: number; transform: string }) => {
    menu.style.opacity = String(frame.opacity);
    menu.style.transform = frame.transform;
  };
  writeFrame(CLOSED_FRAME);

  const anchorBox = (): MenuAnchorBox | null | undefined => {
    if (!anchor) return undefined;
    if (typeof anchor === 'function') return anchor();
    return resolveBoxElement(anchor).getBoundingClientRect();
  };

  /** Points the scale at the anchor, from where the menu now lies. */
  const measureOrigin = () => {
    const box = anchorBox();
    const origin = box
      ? resolveMenuTransformOrigin(box, measureMenuBox(menu))
      : { x: 0.5, y: 0 };
    menu.style.transformOrigin = `${origin.x * 100}% ${origin.y * 100}%`;
  };

  /** An open menu at rest keeps nothing inline but its origin: the stylesheet shows it whole. */
  const settleOpen = () => {
    menu.style.opacity = '';
    menu.style.transform = '';
  };

  const stop = () => {
    const running = current;
    current = undefined;
    running?.cancel();
  };

  return {
    setOpen(open) {
      if (destroyed) return;
      if (open) measureOrigin();
      if (open === isOpen) return;
      isOpen = open;
      // A closing menu no longer takes the pointer, as it no longer takes focus (the adapter makes it inert).
      menu.style.pointerEvents = open ? '' : 'none';

      if (reducedMotion() || motionPolicy.reduced) {
        stop();
        writeFrame(open ? OPEN_FRAME : CLOSED_FRAME);
        if (open) {
          settleOpen();
          return;
        }
        queueMicrotask(() => {
          if (!destroyed && !isOpen && !current) onExited?.();
        });
        return;
      }

      // A motion that is running is carried from the opacity and scale the menu shows; a menu at rest starts from its
      // other state, written as the first frame, so the first frame of an open is never the full size.
      const interrupted = current !== undefined;
      const from = open ? CLOSED_FRAME : OPEN_FRAME;
      const to = open ? OPEN_FRAME : CLOSED_FRAME;
      const scaleTiming = open ? timing : collapseTimingOf(timing);
      const frames = (property: 'opacity' | 'transform') =>
        interrupted
          ? [{ [property]: to[property] }]
          : [{ [property]: from[property] }, { [property]: to[property] }];
      const change = composeHandles([
        animateStyle(menu, frames('opacity'), {
          timing: FADE_TIMING,
          carry: interrupted,
        }),
        animateStyle(menu, frames('transform'), {
          timing: scaleTiming,
          carry: interrupted,
        }),
      ]);
      current = change;
      void change.finished.then((result) => {
        if (current !== change) return;
        current = undefined;
        if (result !== 'finished' || destroyed) return;
        if (open) settleOpen();
        else onExited?.();
      });
    },
    destroy() {
      destroyed = true;
      stop();
      menu.style.opacity = '';
      menu.style.transform = '';
      menu.style.transformOrigin = '';
      menu.style.pointerEvents = '';
    },
  };
}
