import {
  animate,
  type AnimationPlaybackControlsWithThen,
  type Transition,
} from 'motion';

function systemPrefersReducedMotion(): boolean {
  return (
    typeof globalThis.matchMedia === 'function' &&
    globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

const DEFAULT_INDICATOR_TRANSITION: Transition = { duration: 0.3 };

export interface TabsIndicatorControllerOptions {
  /** Positioned ancestor the indicator is absolutely placed within (the tablist). */
  root: HTMLElement;
  /** Absolutely positioned element that visually tracks the selected tab. */
  indicator: HTMLElement;
  /** Re-read on every `update()` call. `null` hides the indicator. */
  selectedTab: () => HTMLElement | null;
  reducedMotion?: () => boolean;
  transition?: Transition;
}

export interface TabsIndicatorController {
  /** Re-measures the selected tab and animates (or snaps) the indicator to it. */
  update(): void;
  destroy(): void;
}

/**
 * Slides the shared indicator under the selected tab. React and Angular both
 * connect this single controller instead of each reimplementing the
 * position/width transition, so the effect is guaranteed to stay identical
 * across frameworks. Replaces the old React-only `motion/react` `layoutId`
 * trick, which Angular has no equivalent for.
 */
export function createTabsIndicatorController({
  root,
  indicator,
  selectedTab,
  reducedMotion = systemPrefersReducedMotion,
  transition = DEFAULT_INDICATOR_TRANSITION,
}: TabsIndicatorControllerOptions): TabsIndicatorController {
  let animation: AnimationPlaybackControlsWithThen | undefined;
  let isFirstApply = true;

  const apply = () => {
    const tab = selectedTab();
    animation?.stop();

    if (!tab) {
      isFirstApply = false;
      indicator.style.opacity = '0';
      return;
    }

    const rootRect = root.getBoundingClientRect();
    const tabRect = tab.getBoundingClientRect();
    const left = tabRect.left - rootRect.left + root.scrollLeft;

    indicator.style.opacity = '1';

    // The initial call establishes the resting position instantly: it is not
    // a transition between two states the user witnessed, so there is
    // nothing to animate from.
    if (reducedMotion() || isFirstApply) {
      isFirstApply = false;
      indicator.style.transform = `translateX(${left}px)`;
      indicator.style.width = `${tabRect.width}px`;
      return;
    }

    animation = animate(
      indicator,
      { x: `${left}px`, width: `${tabRect.width}px` },
      transition,
    );
  };

  const resizeObserver =
    typeof ResizeObserver === 'undefined'
      ? undefined
      : new ResizeObserver(() => apply());
  resizeObserver?.observe(root);

  apply();

  return {
    update: apply,
    destroy() {
      animation?.stop();
      resizeObserver?.disconnect();
    },
  };
}

const DEFAULT_PANEL_TRANSITION: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 40,
};

/**
 * Plays the entrance slide for a newly mounted `TabPanel`: it comes in from
 * `direction` (`-1` left, `1` right, `0` no motion) and settles in place.
 * `TabPanels` only ever mounts the active panel, so there is no outgoing
 * panel to animate in parallel; both adapters call this once per panel
 * mount instead of each owning a separate enter transition.
 */
export function animateTabPanelEnter({
  panel,
  direction,
  reducedMotion = systemPrefersReducedMotion,
  transition = DEFAULT_PANEL_TRANSITION,
}: {
  panel: HTMLElement;
  direction: number;
  reducedMotion?: () => boolean;
  transition?: Transition;
}): AnimationPlaybackControlsWithThen | undefined {
  if (reducedMotion() || direction === 0) {
    panel.style.transform = '';
    panel.style.opacity = '1';
    return undefined;
  }

  return animate(
    panel,
    { x: [`${direction * 100}%`, '0%'], opacity: [0, 1] },
    transition,
  );
}
