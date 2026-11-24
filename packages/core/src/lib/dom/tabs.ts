import {
  animateStyle,
  composeHandles,
  type CurveTiming,
  type MotionHandle,
  type SpringRef,
  reserveMotion,
} from '@udixio/motion/animate';
import { motionPolicy } from '@udixio/motion/policy';

/** The indicator follows the selected tab on the default spatial spring: a fast spring overshoots a tab-wide move by 16 px. */
const DEFAULT_INDICATOR_TIMING: SpringRef = 'spring.default.spatial';
/** A new panel slides in on the default spatial spring, and fades in on the default effects spring. */
const DEFAULT_PANEL_TIMING: SpringRef = 'spring.default.spatial';
const PANEL_FADE_TIMING: SpringRef = 'spring.default.effects';

/** The options of `createTabsIndicatorController`: the tablist, its indicator and the selected tab. */
export interface TabsIndicatorControllerOptions {
  /** Positioned ancestor the indicator is absolutely placed within (the tablist). */
  root: HTMLElement;
  /** Absolutely positioned element that visually tracks the selected tab. */
  indicator: HTMLElement;
  /** Re-read on every `update()` call. `null` hides the indicator. */
  selectedTab: () => HTMLElement | null;
  /** An extra reduced-motion switch, read at each change; the document policy always applies. */
  reducedMotion?: () => boolean;
  /** The motion of the indicator between two tabs; `spring.default.spatial` by default. */
  timing?: SpringRef | CurveTiming;
}

/** A tab indicator that follows the selected tab; `update()` after a selection change, `destroy()` on unmount. */
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
  reducedMotion = () => false,
  timing = DEFAULT_INDICATOR_TIMING,
}: TabsIndicatorControllerOptions): TabsIndicatorController {
  let motion: MotionHandle | undefined;
  /** The position and width the indicator is at or moving to, as a key; `undefined` while hidden. */
  let heading: string | undefined;
  let isFirstApply = true;

  /** Ends the running motion where the indicator is now, and keeps that position inline. */
  const freeze = () => {
    if (!motion) return;
    const { translate, width } = getComputedStyle(indicator);
    motion.cancel();
    motion = undefined;
    indicator.style.translate = translate;
    indicator.style.width = width;
  };

  const apply = () => {
    const tab = selectedTab();

    if (!tab) {
      freeze();
      heading = undefined;
      isFirstApply = false;
      indicator.style.opacity = '0';
      return;
    }

    const rootRect = root.getBoundingClientRect();
    const tabRect = tab.getBoundingClientRect();
    const left = tabRect.left - rootRect.left + root.scrollLeft;
    const translate = `${left}px 0`;
    const width = `${tabRect.width}px`;

    indicator.style.opacity = '1';

    // The initial call establishes the resting position instantly: it is not
    // a transition between two states the user witnessed, so there is
    // nothing to animate from.
    if (reducedMotion() || motionPolicy.reduced || isFirstApply) {
      motion?.cancel();
      motion = undefined;
      heading = `${translate}|${width}`;
      isFirstApply = false;
      indicator.style.transform = '';
      indicator.style.translate = translate;
      indicator.style.width = width;
      return;
    }

    // A re-measure that finds the indicator already heading there (a render
    // or a resize with no change of tab) must not restart the spring: it
    // would lose its velocity at every call.
    const key = `${translate}|${width}`;
    if (key === heading) return;
    heading = key;

    // animateStyle reads the computed position before it replaces a running
    // motion, so a re-measure mid-slide continues from where the indicator is.
    motion = animateStyle(indicator, { translate, width }, { timing });
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
      motion?.cancel();
      motion = undefined;
      resizeObserver?.disconnect();
    },
  };
}

/**
 * Plays the entrance slide for a newly mounted `TabPanel`: it comes in from
 * `direction` (`-1` left, `1` right, `0` no motion) and settles in place.
 * `TabPanels` only ever mounts the active panel, so there is no outgoing
 * panel to animate in parallel; both adapters call this once per panel
 * mount instead of each owning a separate enter transition. Returns the
 * motion, which the adapter cancels when it unmounts the panel.
 */
export function animateTabPanelEnter({
  panel,
  direction,
  reducedMotion = () => false,
  timing = DEFAULT_PANEL_TIMING,
}: {
  panel: HTMLElement;
  direction: number;
  reducedMotion?: () => boolean;
  /** The motion of the slide; the fade keeps its effects spring. `spring.default.spatial` by default. */
  timing?: SpringRef | CurveTiming;
}): MotionHandle | undefined {
  // A panel is shown and hidden by its tabs: it holds its presence, whether or not it slides, for as long as it exists.
  reserveMotion(panel, 'presence', 'TabPanel');
  if (motionPolicy.reduced || reducedMotion() || direction === 0) {
    panel.style.translate = '';
    panel.style.opacity = '';
    return undefined;
  }

  const slide = animateStyle(
    panel,
    [{ translate: `${direction * 100}% 0` }, { translate: '0 0' }],
    { timing },
  );
  const fade = animateStyle(panel, [{ opacity: 0 }, { opacity: 1 }], {
    timing: PANEL_FADE_TIMING,
  });
  const motion = composeHandles([slide, fade]);

  // At rest the panel keeps no inline translate or opacity: its CSS applies.
  void motion.finished.then((result) => {
    if (result !== 'finished') return;
    panel.style.translate = '';
    panel.style.opacity = '';
  });
  return motion;
}
