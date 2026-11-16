import {
  animateStyle,
  cssTiming,
  type CurveTiming,
  type MotionHandle,
  type SpringRef,
} from '@udixio/motion/animate';
import { motionPolicy } from '@udixio/motion/policy';
import type { ComponentMotion } from '../interfaces/motion.interface.js';
import type { StateLayerShapeMotion } from '../interfaces/state-layer.interface.js';
import { press } from './press.js';

export interface StateLayerControllerOptions {
  trigger: HTMLElement;
  layer: HTMLElement;
  disabled?: () => boolean;
  /** An extra reduced-motion switch, read at each change; the document policy always applies. */
  reducedMotion?: () => boolean;
}

export interface StateLayerController {
  updateShape(shape?: StateLayerShapeMotion): void;
  destroy(): void;
}

/** The custom property that sizes a ripple; it is registered as a percentage, so that it interpolates. */
const RIPPLE_RADIUS = '--udixio-ripple-radius';
/** The ripple grows over 500 ms, and fades over 300 ms, on the standard decelerate curve. */
const RIPPLE_ENTER: CurveTiming = { duration: 'duration.long2', easing: 'easing.standardDecelerate' };
const RIPPLE_EXIT: CurveTiming = { duration: 'duration.medium2', easing: 'easing.standardDecelerate' };

/** The documents whose ripple property is registered: registering it twice throws. */
const registeredDocuments = new WeakSet<Document>();

/** Registers the ripple radius as a percentage, once per document, so that its keyframes interpolate. */
function registerRippleRadius(document: Document): void {
  if (registeredDocuments.has(document)) return;
  registeredDocuments.add(document);
  const css = document.defaultView?.CSS;
  if (typeof css?.registerProperty !== 'function') return;
  try {
    css.registerProperty({ name: RIPPLE_RADIUS, syntax: '<percentage>', inherits: false, initialValue: '0%' });
  } catch {
    // The property is already registered in this document: the ripple still animates it.
  }
}

function getRippleOrigin(event: PointerEvent | KeyboardEvent, layer: HTMLElement) {
  const rect = layer.getBoundingClientRect();

  if (event.type === 'keydown' || rect.width === 0 || rect.height === 0) {
    return { x: 50, y: 50 };
  }

  const pointer = event as PointerEvent;
  return {
    x: ((pointer.clientX - rect.left) / rect.width) * 100,
    y: ((pointer.clientY - rect.top) / rect.height) * 100,
  };
}

function createRippleElement(
  layer: HTMLElement,
  event: PointerEvent | KeyboardEvent,
): HTMLSpanElement {
  const ripple = layer.ownerDocument.createElement('span');
  const origin = getRippleOrigin(event, layer);

  ripple.dataset['udixioRipple'] = '';
  ripple.setAttribute('aria-hidden', 'true');
  ripple.style.position = 'absolute';
  ripple.style.inset = '0';
  ripple.style.width = '100%';
  ripple.style.height = '100%';
  ripple.style.pointerEvents = 'none';
  ripple.style.setProperty('--udixio-ripple-x', `${origin.x}%`);
  ripple.style.setProperty('--udixio-ripple-y', `${origin.y}%`);
  ripple.style.setProperty(RIPPLE_RADIUS, '0%');
  ripple.style.background =
    'radial-gradient(ellipse at var(--udixio-ripple-x) var(--udixio-ripple-y), color-mix(in srgb, var(--state-color, var(--color-on-surface)) 10%, transparent) var(--udixio-ripple-radius), transparent calc(var(--udixio-ripple-radius) * 2))';

  layer.append(ripple);
  return ripple;
}

/**
 * Resolves the outermost named group used by the Tailwind state utilities.
 * For `state-ripple-group-[button]`, the matching trigger is `group/button`.
 */
export function findStateLayerTrigger(
  layer: HTMLElement,
  stateClassName: string,
): HTMLElement | null {
  if (stateClassName === 'state-layer') {
    return null;
  }

  const groupMatch = stateClassName.match(/\[([^\]]+)]/);
  const groupClassName = groupMatch ? `group/${groupMatch[1]}` : 'group';
  let current = layer.parentElement;
  let furthestMatch: HTMLElement | null = null;

  while (current) {
    if (current.classList.contains(groupClassName)) {
      furthestMatch = current;
    }
    current = current.parentElement;
  }

  return furthestMatch ?? layer.parentElement;
}

/**
 * The inline colour transition of a state layer, from its motion: the layer
 * snaps when the motion has no timing. Both adapters write it on the layer.
 */
export function getStateLayerTransitionStyle(
  motion?: ComponentMotion,
):
  | { transitionProperty: string; transitionDuration: string; transitionTimingFunction: string }
  | undefined {
  if (motion?.timing === undefined) {
    return undefined;
  }

  const { duration, easing } = cssTiming(motion.timing);
  return {
    transitionProperty: 'background-color, opacity',
    transitionDuration: duration,
    transitionTimingFunction: easing,
  };
}

/**
 * Attaches one accessible press gesture to a state layer. Both React
 * and Angular adapters use this controller and only own lifecycle wiring.
 */
export function createStateLayerController({
  trigger,
  layer,
  disabled = () => false,
  reducedMotion = () => false,
}: StateLayerControllerOptions): StateLayerController {
  const motions = new Set<MotionHandle>();
  const ripples = new Set<HTMLElement>();
  const initialTriggerBorderRadius = trigger.style.borderRadius;
  const initialLayerBorderRadius = layer.style.borderRadius;
  const reduced = () => motionPolicy.reduced || reducedMotion();
  let shape: StateLayerShapeMotion | undefined;
  let shapeMotion: MotionHandle | undefined;
  let isPressing = false;
  let requestedBorderRadius: string | undefined;

  const applyShape = (
    borderRadius: string,
    timing: SpringRef | CurveTiming,
    animated: boolean,
  ) => {
    if (requestedBorderRadius === borderRadius) {
      return;
    }
    requestedBorderRadius = borderRadius;

    if (!animated || reducedMotion()) {
      shapeMotion?.cancel();
      shapeMotion = undefined;
      trigger.style.borderRadius = borderRadius;
      return;
    }

    // animateStyle carries the computed radius into the new morph before it replaces the running one.
    const handle = animateStyle(trigger, { borderRadius }, { timing });
    shapeMotion = handle;
    void handle.finished.then(() => {
      if (shapeMotion === handle) {
        shapeMotion = undefined;
      }
    });
  };

  /** Starts a ripple at the press, and returns it; under reduced motion there is no ripple. */
  const startRipple = (event: PointerEvent | KeyboardEvent): HTMLElement => {
    const ripple = createRippleElement(layer, event);
    ripples.add(ripple);
    const enter = animateStyle(
      ripple,
      [{ [RIPPLE_RADIUS]: '0%' }, { [RIPPLE_RADIUS]: '100%' }],
      { timing: RIPPLE_ENTER },
    );
    motions.add(enter);
    void enter.finished.then(() => motions.delete(enter));
    return ripple;
  };

  /** Fades a ripple out on release, then removes it. */
  const fadeRipple = (ripple: HTMLElement): void => {
    const exit = animateStyle(ripple, [{ opacity: 1 }, { opacity: 0 }], {
      timing: RIPPLE_EXIT,
    });
    motions.add(exit);
    void exit.finished.then(() => {
      motions.delete(exit);
      ripples.delete(ripple);
      ripple.remove();
    });
  };

  const stopPress = press(trigger, (startEvent) => {
    if (disabled()) {
      return;
    }

    if (shape?.enabled) {
      isPressing = true;
      applyShape(shape.pressedBorderRadius, shape.timing, true);
    }

    const ripple = reduced() ? undefined : startRipple(startEvent);

    return () => {
      if (isPressing) {
        queueMicrotask(() => {
          isPressing = false;
          if (shape) {
            applyShape(shape.restingBorderRadius, shape.timing, true);
          }
        });
      }

      if (ripple) {
        fadeRipple(ripple);
      }
    };
  });

  registerRippleRadius(layer.ownerDocument);

  return {
    updateShape(nextShape) {
      const hadShape = shape !== undefined;
      shape = nextShape;

      if (!shape) {
        shapeMotion?.cancel();
        shapeMotion = undefined;
        requestedBorderRadius = undefined;
        trigger.style.borderRadius = initialTriggerBorderRadius;
        layer.style.borderRadius = initialLayerBorderRadius;
        return;
      }

      layer.style.borderRadius = 'inherit';
      if (!isPressing) {
        applyShape(shape.restingBorderRadius, shape.timing, hadShape);
      }
    },
    destroy() {
      stopPress();
      shapeMotion?.cancel();
      shapeMotion = undefined;
      requestedBorderRadius = undefined;
      motions.forEach((motion) => motion.cancel());
      motions.clear();
      ripples.forEach((ripple) => ripple.remove());
      ripples.clear();
      trigger.style.borderRadius = initialTriggerBorderRadius;
      layer.style.borderRadius = initialLayerBorderRadius;
    },
  };
}
