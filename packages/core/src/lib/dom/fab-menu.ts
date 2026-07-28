import { animate, type AnimationPlaybackControlsWithThen } from 'motion';
import type { FabMenuDismissReason } from '../behaviors/fab-menu.behavior.js';

export interface FabMenuControllerOptions {
  root: HTMLElement;
  trigger: HTMLElement;
  panel: HTMLElement;
  onDismiss: (reason: FabMenuDismissReason) => void;
  reducedMotion?: () => boolean;
}

export interface FabMenuController {
  setOpen(open: boolean): void;
  restoreFocusOnClose(): void;
  destroy(): void;
}

const ACTION_DURATION = 0.3;
const ACTION_OPEN_OPACITY_DURATION = 0.15;
const ACTION_CLOSE_OPACITY_DURATION = 0.2;
const ACTION_STAGGER = 0.06;
const TRIGGER_DURATION = 0.3;

function getEffectiveBorderRadius(element: HTMLElement, rect: DOMRect): number {
  const computedRadius =
    element.ownerDocument.defaultView?.getComputedStyle(element)
      .borderTopLeftRadius ||
    element.style.borderTopLeftRadius ||
    element.style.borderRadius;
  const radius = Number.parseFloat(computedRadius);
  if (!Number.isFinite(radius)) return 0;
  return Math.min(radius, rect.width / 2, rect.height / 2);
}

function systemPrefersReducedMotion(): boolean {
  return (
    typeof globalThis.matchMedia === 'function' &&
    globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Connects focus, dismissal and Motion JavaScript choreography shared by every
 * FabMenu adapter. Adapters expose state through `data-open`; this controller
 * remains the single owner of imperative animation and focus restoration.
 */
export function createFabMenuController({
  root,
  trigger,
  panel,
  onDismiss,
  reducedMotion = systemPrefersReducedMotion,
}: FabMenuControllerOptions): FabMenuController {
  const ownerDocument = root.ownerDocument;
  const MutationObserverConstructor =
    ownerDocument.defaultView?.MutationObserver ?? globalThis.MutationObserver;
  const initialPanelHidden = panel.hidden;
  const initialPanelInert = panel.inert;
  const initialPanelAriaHidden = panel.getAttribute('aria-hidden');
  const initialPanelOpacity = panel.style.opacity;
  const initialTriggerWidth = trigger.style.width;
  const initialTriggerHeight = trigger.style.height;
  const initialTriggerBorderRadius = trigger.style.borderRadius;
  const initialActionStyles = new Map<
    HTMLElement,
    { clipPath: string; opacity: string; overflow: string }
  >();
  let animations: AnimationPlaybackControlsWithThen[] = [];
  let animationGeneration = 0;
  let destroyed = false;
  let isOpen = root.dataset['open'] === 'true';
  let restoreFocusOnClose = false;
  let triggerRect = trigger.getBoundingClientRect();
  let triggerRadius = getEffectiveBorderRadius(trigger, triggerRect);

  const getActions = () =>
    Array.from(panel.querySelectorAll<HTMLElement>('[data-fab-menu-action]'));

  const rememberActionStyles = (actions: HTMLElement[]) => {
    for (const action of actions) {
      if (!initialActionStyles.has(action)) {
        initialActionStyles.set(action, {
          clipPath: action.style.clipPath,
          opacity: action.style.opacity,
          overflow: action.style.overflow,
        });
      }
    }
  };

  const stopAnimations = () => {
    animationGeneration += 1;
    animations.forEach((animation) => animation.stop());
    animations = [];
  };

  const focusFirstAction = () => {
    panel
      .querySelector<HTMLElement>(
        '[data-fab-menu-action] button:not(:disabled), [data-fab-menu-action] a[href]:not([aria-disabled="true"])',
      )
      ?.focus();
  };

  const setActionStyles = (
    actions: HTMLElement[],
    clipPath: string,
    opacity: string,
    overflow: string,
  ) => {
    for (const action of actions) {
      action.style.clipPath = clipPath;
      action.style.opacity = opacity;
      action.style.overflow = overflow;
    }
  };

  const animateTriggerSize = (
    nextRect: DOMRect,
    nextOpen: boolean,
    generation: number,
  ): AnimationPlaybackControlsWithThen | undefined => {
    const previousRect = triggerRect;
    const previousRadius = triggerRadius;
    trigger.style.borderRadius = '';
    const nextRadius = nextOpen
      ? Math.min(nextRect.width, nextRect.height) / 2
      : getEffectiveBorderRadius(trigger, nextRect);
    triggerRect = nextRect;
    triggerRadius = nextRadius;
    if (
      reducedMotion() ||
      previousRect.width <= 0 ||
      previousRect.height <= 0 ||
      nextRect.width <= 0 ||
      nextRect.height <= 0 ||
      (previousRect.width === nextRect.width &&
        previousRect.height === nextRect.height &&
        previousRadius === nextRadius)
    ) {
      trigger.style.width = '';
      trigger.style.height = '';
      trigger.style.borderRadius = nextOpen ? `${nextRadius}px` : '';
      return;
    }

    const animation = animate(
      trigger,
      {
        width: [`${previousRect.width}px`, `${nextRect.width}px`],
        height: [`${previousRect.height}px`, `${nextRect.height}px`],
        borderRadius: [`${previousRadius}px`, `${nextRadius}px`],
      },
      {
        duration: TRIGGER_DURATION,
        ease: [0.2, 0, 0, 1],
      },
    );
    animation.then(() => {
      if (!destroyed && generation === animationGeneration) {
        trigger.style.width = '';
        trigger.style.height = '';
        trigger.style.borderRadius = `${nextRadius}px`;
      }
    });
    return animation;
  };

  const applyOpenState = (nextOpen: boolean, initial = false) => {
    if (!initial && nextOpen === isOpen) return;
    isOpen = nextOpen;
    stopAnimations();
    const generation = animationGeneration;
    const actions = getActions();
    rememberActionStyles(actions);
    const triggerAnimation = animateTriggerSize(
      trigger.getBoundingClientRect(),
      nextOpen,
      generation,
    );

    if (nextOpen) {
      panel.hidden = false;
      panel.inert = false;
      panel.style.opacity = '1';
      panel.removeAttribute('aria-hidden');

      if (reducedMotion()) {
        setActionStyles(actions, '', '1', 'visible');
      } else {
        setActionStyles(actions, 'inset(0 0 0 100%)', '0', 'hidden');
        animations = actions.flatMap((action, index) => {
          const delay = (actions.length - index - 1) * ACTION_STAGGER;
          const revealAnimation = animate(
            action,
            {
              clipPath: ['inset(0 0 0 100%)', 'inset(0 0 0 0%)'],
            },
            {
              duration: ACTION_DURATION,
              ease: [0.4, 0, 0.2, 1],
              delay,
            },
          );
          const opacityAnimation = animate(
            action,
            { opacity: [0, 1] },
            {
              duration: ACTION_OPEN_OPACITY_DURATION,
              ease: [0.4, 0, 0.2, 1],
              delay: ACTION_OPEN_OPACITY_DURATION + delay,
            },
          );
          revealAnimation.then(() => {
            if (!destroyed && isOpen && generation === animationGeneration) {
              action.style.clipPath = 'inset(0 0 0 0%)';
              action.style.opacity = '1';
              action.style.overflow = 'visible';
            }
          });
          return [revealAnimation, opacityAnimation];
        });
        if (triggerAnimation) animations.push(triggerAnimation);
      }

      queueMicrotask(() => {
        if (!destroyed && isOpen) focusFirstAction();
      });
      return;
    }

    panel.inert = true;
    panel.style.opacity = '1';
    panel.setAttribute('aria-hidden', 'true');

    if (restoreFocusOnClose) {
      restoreFocusOnClose = false;
      queueMicrotask(() => {
        if (!destroyed && !isOpen) trigger.focus();
      });
    }

    if (initial || reducedMotion() || actions.length === 0) {
      if (triggerAnimation) animations = [triggerAnimation];
      setActionStyles(actions, 'inset(0 0 0 100%)', '0', 'hidden');
      panel.style.opacity = '0';
      panel.hidden = true;
      return;
    }

    setActionStyles(actions, '', '1', 'hidden');
    animations = actions.flatMap((action, index) => {
      const delay = (actions.length - index - 1) * ACTION_STAGGER;
      return [
        animate(
          action,
          {
            clipPath: ['inset(0 0 0 0%)', 'inset(0 0 0 100%)'],
          },
          {
            duration: ACTION_DURATION,
            ease: [0.4, 0, 0.2, 1],
            delay,
          },
        ),
        animate(
          action,
          { opacity: [1, 0] },
          {
            duration: ACTION_CLOSE_OPACITY_DURATION,
            ease: [0.4, 0, 0.2, 1],
            delay,
          },
        ),
      ];
    });
    if (triggerAnimation) animations.push(triggerAnimation);
    Promise.all(
      animations.map((animation) => animation.then(() => undefined)),
    ).then(() => {
      if (!destroyed && !isOpen && generation === animationGeneration) {
        panel.style.opacity = '0';
        panel.hidden = true;
      }
    });
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!isOpen || event.key !== 'Escape') return;
    event.preventDefault();
    event.stopPropagation();
    restoreFocusOnClose = true;
    onDismiss('escape');
  };
  const handlePointerDown = (event: Event) => {
    if (!isOpen || root.contains(event.target as Node)) return;
    onDismiss('outside');
  };
  const handleActionClick = (event: Event) => {
    const target = event.target;
    const ElementConstructor = ownerDocument.defaultView?.Element;
    if (!ElementConstructor || !(target instanceof ElementConstructor)) return;
    const action = target.closest<HTMLElement>('[data-fab-menu-action]');
    if (!action || action.matches(':disabled, [aria-disabled="true"]')) return;
    restoreFocusOnClose = true;
  };
  const observer = new MutationObserverConstructor(() => {
    applyOpenState(root.dataset['open'] === 'true');
  });

  ownerDocument.addEventListener('keydown', handleKeyDown);
  ownerDocument.addEventListener('pointerdown', handlePointerDown, true);
  panel.addEventListener('click', handleActionClick);
  observer.observe(root, {
    attributes: true,
    attributeFilter: ['data-open'],
  });
  applyOpenState(isOpen, true);

  return {
    setOpen(open) {
      applyOpenState(open);
    },
    restoreFocusOnClose() {
      restoreFocusOnClose = true;
    },
    destroy() {
      destroyed = true;
      stopAnimations();
      observer.disconnect();
      ownerDocument.removeEventListener('keydown', handleKeyDown);
      ownerDocument.removeEventListener('pointerdown', handlePointerDown, true);
      panel.removeEventListener('click', handleActionClick);
      panel.hidden = initialPanelHidden;
      panel.inert = initialPanelInert;
      panel.style.opacity = initialPanelOpacity;
      trigger.style.width = initialTriggerWidth;
      trigger.style.height = initialTriggerHeight;
      trigger.style.borderRadius = initialTriggerBorderRadius;
      if (initialPanelAriaHidden === null) {
        panel.removeAttribute('aria-hidden');
      } else {
        panel.setAttribute('aria-hidden', initialPanelAriaHidden);
      }
      for (const [action, styles] of initialActionStyles) {
        action.style.clipPath = styles.clipPath;
        action.style.opacity = styles.opacity;
        action.style.overflow = styles.overflow;
      }
    },
  };
}
