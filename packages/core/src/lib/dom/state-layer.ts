import { animate, press, type AnimationPlaybackControls } from 'motion';
import type { StateLayerShapeTransition } from '../interfaces/state-layer.interface.js';

export interface StateLayerControllerOptions {
  trigger: HTMLElement;
  layer: HTMLElement;
  disabled?: () => boolean;
  reducedMotion?: () => boolean;
  enterDuration?: number;
  exitDuration?: number;
}

export interface StateLayerController {
  updateShape(shape?: StateLayerShapeTransition): void;
  destroy(): void;
}

function systemPrefersReducedMotion(): boolean {
  return (
    typeof globalThis.matchMedia === 'function' &&
    globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function getRippleOrigin(event: PointerEvent, layer: HTMLElement) {
  const rect = layer.getBoundingClientRect();
  const isKeyboardPress = event.pointerType === '';

  if (isKeyboardPress || rect.width === 0 || rect.height === 0) {
    return { x: 50, y: 50 };
  }

  return {
    x: ((event.clientX - rect.left) / rect.width) * 100,
    y: ((event.clientY - rect.top) / rect.height) * 100,
  };
}

function createRippleElement(
  layer: HTMLElement,
  event: PointerEvent,
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
  ripple.style.setProperty('--udixio-ripple-radius', '0%');
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
 * Attaches one accessible Motion press gesture to a state layer. Both React
 * and Angular adapters use this controller and only own lifecycle wiring.
 */
export function createStateLayerController({
  trigger,
  layer,
  disabled = () => false,
  reducedMotion = systemPrefersReducedMotion,
  enterDuration = 0.5,
  exitDuration = 0.3,
}: StateLayerControllerOptions): StateLayerController {
  const animations = new Set<AnimationPlaybackControls>();
  const ripples = new Set<HTMLElement>();
  const initialTriggerBorderRadius = trigger.style.borderRadius;
  const initialLayerBorderRadius = layer.style.borderRadius;
  let shape: StateLayerShapeTransition | undefined;
  let shapeAnimation: AnimationPlaybackControls | undefined;
  let isPressing = false;
  let requestedBorderRadius: string | undefined;

  const applyShape = (
    borderRadius: string,
    transition: StateLayerShapeTransition['transition'],
    animated: boolean,
  ) => {
    if (requestedBorderRadius === borderRadius) {
      return;
    }
    requestedBorderRadius = borderRadius;
    shapeAnimation?.stop();
    shapeAnimation = undefined;

    if (!animated || reducedMotion()) {
      trigger.style.borderRadius = borderRadius;
      return;
    }

    const animation = animate(trigger, { borderRadius }, transition);
    shapeAnimation = animation;
    animation.then(() => {
      if (shapeAnimation === animation) {
        shapeAnimation = undefined;
      }
    });
  };

  const stopPress = press(trigger, (_element, startEvent) => {
    if (disabled()) {
      return;
    }

    if (shape?.enabled) {
      isPressing = true;
      applyShape(shape.pressedBorderRadius, shape.transition, true);
    }

    const ripple = createRippleElement(layer, startEvent);
    const shouldReduceMotion = reducedMotion();
    ripples.add(ripple);

    const enterAnimation = animate(
      ripple,
      { '--udixio-ripple-radius': ['0%', '100%'] },
      { duration: shouldReduceMotion ? 0 : enterDuration, ease: 'easeOut' },
    );
    animations.add(enterAnimation);
    enterAnimation.then(() => animations.delete(enterAnimation));

    return () => {
      if (isPressing) {
        queueMicrotask(() => {
          isPressing = false;
          if (shape) {
            applyShape(shape.restingBorderRadius, shape.transition, true);
          }
        });
      }

      const exitAnimation = animate(
        ripple,
        { opacity: [1, 0] },
        { duration: shouldReduceMotion ? 0 : exitDuration, ease: 'easeOut' },
      );
      animations.add(exitAnimation);
      exitAnimation.then(() => {
        animations.delete(exitAnimation);
        ripples.delete(ripple);
        ripple.remove();
      });
    };
  });

  return {
    updateShape(nextShape) {
      const hadShape = shape !== undefined;
      shape = nextShape;

      if (!shape) {
        shapeAnimation?.stop();
        shapeAnimation = undefined;
        requestedBorderRadius = undefined;
        trigger.style.borderRadius = initialTriggerBorderRadius;
        layer.style.borderRadius = initialLayerBorderRadius;
        return;
      }

      layer.style.borderRadius = 'inherit';
      if (!isPressing) {
        applyShape(shape.restingBorderRadius, shape.transition, hadShape);
      }
    },
    destroy() {
      stopPress();
      shapeAnimation?.stop();
      requestedBorderRadius = undefined;
      animations.forEach((animation) => animation.stop());
      ripples.forEach((ripple) => ripple.remove());
      trigger.style.borderRadius = initialTriggerBorderRadius;
      layer.style.borderRadius = initialLayerBorderRadius;
      animations.clear();
      ripples.clear();
    },
  };
}
