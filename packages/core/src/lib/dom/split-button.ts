import { animate, type JSAnimation } from 'animejs';
import type { SplitButtonSize } from '../interfaces/split-button.interface';

export type SplitButtonDismissReason = 'escape' | 'outside';

export interface SplitButtonControllerOptions {
  root: HTMLElement;
  primaryButton: HTMLElement;
  menuButton: HTMLElement;
  menuIcon: HTMLElement;
  size?: SplitButtonSize;
  onDismiss: (reason: SplitButtonDismissReason) => void;
  reducedMotion?: () => boolean;
}

export interface SplitButtonController {
  setOpen(open: boolean, instant?: boolean): void;
  restoreFocusOnClose(): void;
  destroy(): void;
}

const TRANSITION_DURATION = 240;
const RESTING_INNER_RADIUS: Record<SplitButtonSize, number> = {
  xSmall: 4,
  small: 4,
  medium: 4,
  large: 8,
  xLarge: 12,
};

type CornerRadiusProperty =
  | 'borderTopLeftRadius'
  | 'borderTopRightRadius'
  | 'borderBottomLeftRadius'
  | 'borderBottomRightRadius';

interface InnerCornerProperties {
  top: CornerRadiusProperty;
  bottom: CornerRadiusProperty;
  topCss: string;
}

interface ButtonShapeState {
  button: HTMLElement;
  corners: InnerCornerProperties;
  hovered: boolean;
  focused: boolean;
  pressed: boolean;
  target: number;
  animation?: JSAnimation;
}

function systemPrefersReducedMotion(): boolean {
  return (
    typeof globalThis.matchMedia === 'function' &&
    globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function isHovered(button: HTMLElement): boolean {
  try {
    return button.matches(':hover');
  } catch {
    return false;
  }
}

function isFocusVisible(button: HTMLElement, root: HTMLElement): boolean {
  try {
    return button.matches(':focus-visible');
  } catch {
    return root.ownerDocument.activeElement === button;
  }
}

function isDisabled(button: HTMLElement): boolean {
  return button.matches(':disabled, [aria-disabled="true"]');
}

function getInlineRadius(
  element: HTMLElement,
  property: string,
  fallback: number,
): number {
  const value = Number.parseFloat(
    element.style.getPropertyValue(property) ||
      element.ownerDocument.defaultView
        ?.getComputedStyle(element)
        .getPropertyValue(property) ||
      '',
  );
  return Number.isFinite(value) ? value : fallback;
}

/**
 * Shares independent per-button corner morphs, chevron motion, outside
 * dismissal, Escape handling, and focus restoration across framework adapters.
 */
export function createSplitButtonController({
  root,
  primaryButton,
  menuButton,
  menuIcon,
  size = 'small',
  onDismiss,
  reducedMotion = systemPrefersReducedMotion,
}: SplitButtonControllerOptions): SplitButtonController {
  const ownerDocument = root.ownerDocument;
  const restingInnerRadius = RESTING_INNER_RADIUS[size];
  const getInnerCornerProperties = () => {
    const isRtl =
      ownerDocument.defaultView?.getComputedStyle(root).direction === 'rtl';
    return isRtl
      ? {
          primary: {
            top: 'borderTopLeftRadius',
            bottom: 'borderBottomLeftRadius',
            topCss: 'border-top-left-radius',
          } satisfies InnerCornerProperties,
          menu: {
            top: 'borderTopRightRadius',
            bottom: 'borderBottomRightRadius',
            topCss: 'border-top-right-radius',
          } satisfies InnerCornerProperties,
        }
      : {
          primary: {
            top: 'borderTopRightRadius',
            bottom: 'borderBottomRightRadius',
            topCss: 'border-top-right-radius',
          } satisfies InnerCornerProperties,
          menu: {
            top: 'borderTopLeftRadius',
            bottom: 'borderBottomLeftRadius',
            topCss: 'border-top-left-radius',
          } satisfies InnerCornerProperties,
        };
  };

  const cornerProperties = getInnerCornerProperties();
  const createShapeState = (
    button: HTMLElement,
    corners: InnerCornerProperties,
  ): ButtonShapeState => ({
    button,
    corners,
    hovered: isHovered(button),
    focused: isFocusVisible(button, root),
    pressed: false,
    target: Number.NaN,
  });

  const primaryShape = createShapeState(
    primaryButton,
    cornerProperties.primary,
  );
  const menuShape = createShapeState(menuButton, cornerProperties.menu);
  const shapes = [primaryShape, menuShape];
  const pointerPresses = new Map<number, ButtonShapeState>();

  let isOpen = root.dataset['open'] === 'true';
  let restoreFocus = false;
  let destroyed = false;
  let iconAnimation: JSAnimation | undefined;
  let listening = false;
  let pointerEndListening = false;

  const getExpandedRadius = (button: HTMLElement) => {
    const height = button.getBoundingClientRect().height;
    return height > 0 ? height / 2 : 20;
  };

  const applyRadius = (shape: ButtonShapeState, radius: number) => {
    shape.button.style[shape.corners.top] = `${radius}px`;
    shape.button.style[shape.corners.bottom] = `${radius}px`;
  };

  const syncShape = (shape: ButtonShapeState, instant = false) => {
    if (destroyed) return;
    const selected = shape === menuShape && isOpen;
    const shouldExpand =
      !isDisabled(shape.button) &&
      (selected || shape.hovered || shape.focused || shape.pressed);
    const nextRadius = shouldExpand
      ? getExpandedRadius(shape.button)
      : restingInnerRadius;
    if (nextRadius === shape.target) return;

    const previousRadius = getInlineRadius(
      shape.button,
      shape.corners.topCss,
      restingInnerRadius,
    );
    shape.animation?.cancel();
    shape.animation = undefined;
    shape.target = nextRadius;

    if (
      instant ||
      reducedMotion() ||
      Math.abs(previousRadius - nextRadius) < 0.01
    ) {
      applyRadius(shape, nextRadius);
      return;
    }

    const radiusState = { value: previousRadius };
    shape.animation = animate(radiusState, {
      value: nextRadius,
      duration: TRANSITION_DURATION,
      ease: 'out(3)',
      onUpdate: () => applyRadius(shape, radiusState.value),
    });
  };

  const getShapeForTarget = (
    target: EventTarget | null,
  ): ButtonShapeState | undefined => {
    if (!target || typeof (target as Node).nodeType !== 'number') {
      return undefined;
    }
    const node = target as Node;
    return shapes.find(
      (shape) => !isDisabled(shape.button) && shape.button.contains(node),
    );
  };

  const handlePrimaryPointerEnter = () => {
    primaryShape.hovered = true;
    syncShape(primaryShape);
  };
  const handlePrimaryPointerLeave = () => {
    primaryShape.hovered = false;
    syncShape(primaryShape);
  };
  const handleMenuPointerEnter = () => {
    menuShape.hovered = true;
    syncShape(menuShape);
  };
  const handleMenuPointerLeave = () => {
    menuShape.hovered = false;
    syncShape(menuShape);
  };

  const handleFocusIn = (shape: ButtonShapeState) => () => {
    shape.focused = isFocusVisible(shape.button, root);
    syncShape(shape);
  };
  const handleFocusOut = (shape: ButtonShapeState) => () => {
    queueMicrotask(() => {
      if (destroyed) return;
      shape.focused = isFocusVisible(shape.button, root);
      syncShape(shape);
    });
  };
  const handlePrimaryFocusIn = handleFocusIn(primaryShape);
  const handlePrimaryFocusOut = handleFocusOut(primaryShape);
  const handleMenuFocusIn = handleFocusIn(menuShape);
  const handleMenuFocusOut = handleFocusOut(menuShape);

  const removePointerEndListeners = () => {
    if (!pointerEndListening) return;
    ownerDocument.removeEventListener('pointerup', handlePointerEnd, true);
    ownerDocument.removeEventListener('pointercancel', handlePointerEnd, true);
    pointerEndListening = false;
  };

  const handlePointerEnd = (event: Event) => {
    const pointerId = (event as PointerEvent).pointerId ?? 1;
    const shape = pointerPresses.get(pointerId);
    if (!shape) return;
    pointerPresses.delete(pointerId);
    shape.pressed = [...pointerPresses.values()].includes(shape);
    syncShape(shape);
    if (pointerPresses.size === 0) removePointerEndListeners();
  };

  const handleInteractionPointerDown = (event: Event) => {
    const shape = getShapeForTarget(event.target);
    if (!shape) return;
    const pointerId = (event as PointerEvent).pointerId ?? 1;
    const previousShape = pointerPresses.get(pointerId);
    if (previousShape) {
      pointerPresses.delete(pointerId);
      previousShape.pressed = [...pointerPresses.values()].includes(
        previousShape,
      );
      syncShape(previousShape);
    }
    pointerPresses.set(pointerId, shape);
    shape.pressed = true;
    syncShape(shape);
    if (!pointerEndListening) {
      ownerDocument.addEventListener('pointerup', handlePointerEnd, true);
      ownerDocument.addEventListener(
        'pointercancel',
        handlePointerEnd,
        true,
      );
      pointerEndListening = true;
    }
  };

  const handleOutsidePointerDown = (event: Event) => {
    if (!root.contains(event.target as Node)) {
      restoreFocus = false;
      onDismiss('outside');
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    const menu = root.querySelector<HTMLElement>('[role="menu"]');
    if (
      event.key !== 'Escape' ||
      !menu ||
      !menu.contains(event.target as Node)
    ) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    restoreFocus = true;
    onDismiss('escape');
  };

  const startListening = () => {
    if (listening) return;
    ownerDocument.addEventListener(
      'pointerdown',
      handleOutsidePointerDown,
      true,
    );
    ownerDocument.addEventListener('keydown', handleKeyDown, true);
    listening = true;
  };

  const stopListening = () => {
    if (!listening) return;
    ownerDocument.removeEventListener(
      'pointerdown',
      handleOutsidePointerDown,
      true,
    );
    ownerDocument.removeEventListener('keydown', handleKeyDown, true);
    listening = false;
  };

  for (const shape of shapes) syncShape(shape, true);
  menuIcon.style.rotate = isOpen ? '180deg' : '0deg';

  primaryButton.addEventListener('pointerenter', handlePrimaryPointerEnter);
  primaryButton.addEventListener('pointerleave', handlePrimaryPointerLeave);
  menuButton.addEventListener('pointerenter', handleMenuPointerEnter);
  menuButton.addEventListener('pointerleave', handleMenuPointerLeave);
  primaryButton.addEventListener('focusin', handlePrimaryFocusIn);
  primaryButton.addEventListener('focusout', handlePrimaryFocusOut);
  menuButton.addEventListener('focusin', handleMenuFocusIn);
  menuButton.addEventListener('focusout', handleMenuFocusOut);
  root.addEventListener('pointerdown', handleInteractionPointerDown, true);
  if (isOpen) startListening();

  return {
    setOpen(open, instant = false) {
      if (destroyed || open === isOpen) return;
      isOpen = open;
      // Selection expands only the menu button; interaction shapes stay local
      // to the button that receives hover, focus-visible, or press input.
      syncShape(menuShape, instant);
      iconAnimation?.cancel();
      iconAnimation = undefined;

      if (open) {
        restoreFocus = false;
        startListening();
      } else {
        stopListening();
        if (restoreFocus) {
          restoreFocus = false;
          queueMicrotask(() => {
            if (!destroyed && !isOpen) menuButton.focus();
          });
        }
      }

      if (instant || reducedMotion()) {
        menuIcon.style.rotate = open ? '180deg' : '0deg';
        return;
      }

      iconAnimation = animate(menuIcon, {
        rotate: open ? '180deg' : '0deg',
        duration: TRANSITION_DURATION,
        ease: 'out(3)',
      });
    },
    restoreFocusOnClose() {
      restoreFocus = true;
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      stopListening();
      removePointerEndListeners();
      pointerPresses.clear();
      primaryButton.removeEventListener(
        'pointerenter',
        handlePrimaryPointerEnter,
      );
      primaryButton.removeEventListener(
        'pointerleave',
        handlePrimaryPointerLeave,
      );
      menuButton.removeEventListener('pointerenter', handleMenuPointerEnter);
      menuButton.removeEventListener('pointerleave', handleMenuPointerLeave);
      primaryButton.removeEventListener('focusin', handlePrimaryFocusIn);
      primaryButton.removeEventListener('focusout', handlePrimaryFocusOut);
      menuButton.removeEventListener('focusin', handleMenuFocusIn);
      menuButton.removeEventListener('focusout', handleMenuFocusOut);
      root.removeEventListener(
        'pointerdown',
        handleInteractionPointerDown,
        true,
      );
      for (const shape of shapes) shape.animation?.cancel();
      iconAnimation?.cancel();
    },
  };
}
