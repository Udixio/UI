import {
  animateStyle,
  composeHandles,
  type MotionHandle,
  type SpringRef,
  staggerCap,
  staggerDelay,
  staggerStep,
} from '@udixio/motion/animate';
import { motionPolicy } from '@udixio/motion/policy';
import type { FabMenuDismissReason } from '../behaviors/fab-menu.behavior.js';

export interface FabMenuControllerOptions {
  root: HTMLElement;
  trigger: HTMLElement;
  closedTrigger?: HTMLElement;
  openTrigger?: HTMLElement;
  panel: HTMLElement;
  onDismiss: (reason: FabMenuDismissReason) => void;
  /** An extra reduced-motion switch, read at each change; the document policy always applies. */
  reducedMotion?: () => boolean;
}

export interface FabMenuController {
  setOpen(open: boolean): void;
  restoreFocusOnClose(): void;
  destroy(): void;
}

/** The trigger morphs between its closed and open sizes as one surface: the default spatial spring. */
const TRIGGER_TIMING: SpringRef = 'spring.default.spatial';
/** Each action wipes in and out as a small part: the fast spatial spring. */
const ACTION_WIPE_TIMING: SpringRef = 'spring.fast.spatial';
/** Each action fades on the fast effects spring, whatever its wipe. */
const ACTION_FADE_TIMING: SpringRef = 'spring.fast.effects';
/** An opening action fades in this many ms after its wipe starts, plus its own stagger delay. */
const ACTION_FADE_IN_DELAY = 150;
/** The clip of an action that is hidden, and the clip of one that is fully shown. */
const CLIPPED = 'inset(0 0 0 100%)';
const REVEALED = 'inset(0 0 0 0%)';

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

/**
 * Connects focus, dismissal and the morph and cascade of the menu, shared by every
 * FabMenu adapter. Adapters expose state through `data-open`; this controller
 * remains the single owner of imperative animation and focus restoration.
 */
export function createFabMenuController({
  root,
  trigger,
  closedTrigger = trigger,
  openTrigger = trigger,
  panel,
  onDismiss,
  reducedMotion = () => false,
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
  /** The morph of the trigger while it runs; a new morph carries from the size it shows. */
  let triggerMotion: MotionHandle | undefined;
  /** The wipe and fade of each action while they run, keyed by action. */
  const actionMotions = new Map<HTMLElement, MotionHandle>();
  let animationGeneration = 0;
  let destroyed = false;
  let isOpen = root.dataset['open'] === 'true';
  let restoreFocusOnClose = false;
  /**
   * Whether the visitor has just activated the trigger, with a pointer or a key (both give a `click`). Only such an
   * open moves focus into the menu: an open from code (a restored state, an autoplay) leaves focus where it is.
   */
  let openedByTrigger = false;
  let triggerActivationFrame: number | undefined;
  const initialTarget = isOpen ? openTrigger : closedTrigger;
  let triggerRect = initialTarget.getBoundingClientRect();
  let triggerRadius = isOpen
    ? Math.min(triggerRect.width, triggerRect.height) / 2
    : getEffectiveBorderRadius(initialTarget, triggerRect);

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

  /** Ends the action motions; each action keeps the value it shows, with no end frame written. */
  const cancelActionMotions = () => {
    for (const motion of actionMotions.values()) motion.cancel();
    actionMotions.clear();
  };

  /** Ends every running motion of the menu, as `cancelActionMotions` does for the actions. */
  const cancelMotions = () => {
    triggerMotion?.cancel();
    triggerMotion = undefined;
    cancelActionMotions();
  };

  const focusFirstAction = () => {
    panel
      .querySelector<HTMLElement>(
        '[data-fab-menu-action] button:not(:disabled), [data-fab-menu-action] a[href]:not([aria-disabled="true"])',
      )
      // The menu can sit at the edge of the viewport: moving focus does not scroll the page.
      ?.focus({ preventScroll: true });
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

  /**
   * Morphs the trigger to the size and radius of its target. A morph that is already
   * running carries from the value the trigger shows; a fresh one starts from its
   * previous target, because the adapters have already rendered the new size.
   */
  const morphTrigger = (
    target: HTMLElement,
    nextOpen: boolean,
    instant: boolean,
    generation: number,
  ): MotionHandle | undefined => {
    const previousRect = triggerRect;
    const previousRadius = triggerRadius;
    const nextRect = target.getBoundingClientRect();
    const nextRadius = nextOpen
      ? Math.min(nextRect.width, nextRect.height) / 2
      : getEffectiveBorderRadius(target, nextRect);
    triggerRect = nextRect;
    triggerRadius = nextRadius;
    if (
      instant ||
      previousRect.width <= 0 ||
      previousRect.height <= 0 ||
      nextRect.width <= 0 ||
      nextRect.height <= 0 ||
      (previousRect.width === nextRect.width &&
        previousRect.height === nextRect.height &&
        previousRadius === nextRadius)
    ) {
      triggerMotion?.cancel();
      triggerMotion = undefined;
      trigger.style.width = '';
      trigger.style.height = '';
      trigger.style.borderRadius = nextOpen ? `${nextRadius}px` : '';
      return undefined;
    }

    const interrupted = triggerMotion !== undefined;
    const morph = animateStyle(
      trigger,
      [
        {
          width: `${previousRect.width}px`,
          height: `${previousRect.height}px`,
          borderRadius: `${previousRadius}px`,
        },
        {
          width: `${nextRect.width}px`,
          height: `${nextRect.height}px`,
          borderRadius: `${nextRadius}px`,
        },
      ],
      { timing: TRIGGER_TIMING, carry: interrupted },
    );
    triggerMotion = morph;
    void morph.finished.then((result) => {
      if (triggerMotion === morph) triggerMotion = undefined;
      if (
        result !== 'finished' ||
        destroyed ||
        generation !== animationGeneration
      )
        return;
      // The size goes back to CSS, which the adapters already render for the new state.
      trigger.style.width = '';
      trigger.style.height = '';
      trigger.style.borderRadius = `${nextRadius}px`;
    });
    return morph;
  };

  /**
   * Wipes and fades every action: outward from the trigger when opening, back into it when
   * closing. The panel sits above the trigger, so the last action, nearest the trigger, leads;
   * each earlier action starts one stagger step later, up to the cascade cap.
   */
  const playActions = (
    actions: HTMLElement[],
    open: boolean,
    generation: number,
  ): MotionHandle[] => {
    const style = (root.ownerDocument.defaultView ?? window).getComputedStyle(
      root,
    );
    const step = staggerStep(style, 'normal');
    const cap = staggerCap(style);
    return actions.map((action, index) => {
      const delay = staggerDelay(actions.length - index - 1, step, cap);
      const interrupted = actionMotions.has(action);
      const wipe = animateStyle(
        action,
        open
          ? [{ clipPath: CLIPPED }, { clipPath: REVEALED }]
          : [{ clipPath: REVEALED }, { clipPath: CLIPPED }],
        { timing: ACTION_WIPE_TIMING, delay, carry: interrupted },
      );
      const fade = animateStyle(
        action,
        open
          ? [{ opacity: 0 }, { opacity: 1 }]
          : [{ opacity: 1 }, { opacity: 0 }],
        {
          timing: ACTION_FADE_TIMING,
          delay: open ? delay + ACTION_FADE_IN_DELAY : delay,
          carry: interrupted,
        },
      );
      const motion = composeHandles([wipe, fade]);
      actionMotions.set(action, motion);
      void motion.finished.then((result) => {
        if (actionMotions.get(action) === motion) actionMotions.delete(action);
        if (!open || result !== 'finished' || destroyed || !isOpen) return;
        if (generation !== animationGeneration) return;
        // An open action keeps no clip at rest, so its shadow is not cut.
        action.style.clipPath = '';
        action.style.overflow = 'visible';
      });
      return motion;
    });
  };

  const applyOpenState = (nextOpen: boolean, initial = false) => {
    if (!initial && nextOpen === isOpen) return;
    isOpen = nextOpen;
    const fromTrigger = openedByTrigger;
    forgetTriggerActivation();
    animationGeneration += 1;
    const generation = animationGeneration;
    const actions = getActions();
    rememberActionStyles(actions);
    const instant = reducedMotion() || motionPolicy.reduced;
    const targetTrigger = nextOpen ? openTrigger : closedTrigger;
    const triggerMorph = morphTrigger(
      targetTrigger,
      nextOpen,
      instant,
      generation,
    );

    if (nextOpen) {
      panel.hidden = false;
      panel.inert = false;
      panel.style.opacity = '1';
      panel.removeAttribute('aria-hidden');

      if (instant) {
        cancelActionMotions();
        setActionStyles(actions, '', '1', 'visible');
      } else {
        for (const action of actions) action.style.overflow = 'hidden';
        playActions(actions, true, generation);
      }

      if (fromTrigger) {
        queueMicrotask(() => {
          if (!destroyed && isOpen) focusFirstAction();
        });
      }
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

    if (initial || instant || actions.length === 0) {
      cancelActionMotions();
      setActionStyles(actions, CLIPPED, '0', 'hidden');
      panel.style.opacity = '0';
      panel.hidden = true;
      return;
    }

    for (const action of actions) action.style.overflow = 'hidden';
    const motions = playActions(actions, false, generation);
    if (triggerMorph) motions.push(triggerMorph);
    void composeHandles(motions).finished.then((result) => {
      if (result !== 'finished' || destroyed || isOpen) return;
      if (generation !== animationGeneration) return;
      panel.style.opacity = '0';
      panel.hidden = true;
    });
  };

  function forgetTriggerActivation() {
    openedByTrigger = false;
    if (triggerActivationFrame !== undefined) {
      ownerDocument.defaultView?.cancelAnimationFrame(triggerActivationFrame);
      triggerActivationFrame = undefined;
    }
  }
  /**
   * Remembers an activation of the trigger until the open it causes. The adapters render the new state within the
   * frame of the click (Angular may wait for an animation frame), so an activation that opened nothing by the frame
   * after is forgotten, and a later open from code does not take focus.
   */
  const handleTriggerClick = () => {
    forgetTriggerActivation();
    openedByTrigger = true;
    const view = ownerDocument.defaultView;
    if (!view?.requestAnimationFrame) return;
    triggerActivationFrame = view.requestAnimationFrame(() => {
      triggerActivationFrame = view.requestAnimationFrame(() => {
        triggerActivationFrame = undefined;
        openedByTrigger = false;
      });
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
  // In the capture phase, so the activation is known before any listener of the adapter opens the menu.
  trigger.addEventListener('click', handleTriggerClick, true);
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
      cancelMotions();
      observer.disconnect();
      ownerDocument.removeEventListener('keydown', handleKeyDown);
      ownerDocument.removeEventListener('pointerdown', handlePointerDown, true);
      panel.removeEventListener('click', handleActionClick);
      trigger.removeEventListener('click', handleTriggerClick, true);
      forgetTriggerActivation();
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
