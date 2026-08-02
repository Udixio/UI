import { animate, type AnimationPlaybackControls } from 'motion';

export type NavigationRailItemLabelAxis = 'horizontal' | 'vertical';

export interface NavigationRailItemLabelControllerOptions {
  label: HTMLElement;
  axis: () => NavigationRailItemLabelAxis;
  visible: () => boolean;
  reducedMotion?: () => boolean;
  duration?: number;
}

export interface NavigationRailItemLabelController {
  /** Re-reads `axis`/`visible` and animates only if either changed. */
  update(): void;
  destroy(): void;
}

function systemPrefersReducedMotion(): boolean {
  return (
    typeof globalThis.matchMedia === 'function' &&
    globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Reveals or hides a `NavigationRailItem` label by animating its width
 * (horizontal variant) or height (vertical variant) together with its
 * opacity. Both React and Angular adapters use this controller and only own
 * mount lifecycle wiring; the label element itself is always present in the
 * DOM so neither adapter needs to coordinate an exit-animation-before-unmount
 * sequence.
 */
export function createNavigationRailItemLabelController({
  label,
  axis,
  visible,
  reducedMotion = systemPrefersReducedMotion,
  duration = 0.3,
}: NavigationRailItemLabelControllerOptions): NavigationRailItemLabelController {
  let animation: AnimationPlaybackControls | undefined;
  let lastAxis: NavigationRailItemLabelAxis | undefined;
  let lastVisible: boolean | undefined;
  let isFirstApply = true;

  const apply = () => {
    const currentAxis = axis();
    const currentVisible = visible();
    if (currentAxis === lastAxis && currentVisible === lastVisible) {
      return;
    }
    const wasFirstApply = isFirstApply;
    isFirstApply = false;
    lastAxis = currentAxis;
    lastVisible = currentVisible;

    label.setAttribute('aria-hidden', String(!currentVisible));

    animation?.stop();
    const sizeProperty = currentAxis === 'horizontal' ? 'width' : 'height';

    // The initial call establishes the resting state instantly: it is not a
    // transition between two states the user witnessed, so there is nothing
    // to animate from.
    if (reducedMotion() || wasFirstApply) {
      label.style[sizeProperty] = currentVisible ? 'auto' : '0px';
      label.style.opacity = currentVisible ? '1' : '0';
      return;
    }

    animation = animate(
      label,
      {
        [sizeProperty]: currentVisible ? 'auto' : 0,
        opacity: currentVisible ? 1 : 0,
      },
      {
        duration,
        opacity: {
          duration: duration / 2,
          delay: currentVisible ? duration / 2 : 0,
        },
      },
    );
  };

  apply();

  return {
    update: apply,
    destroy() {
      animation?.stop();
    },
  };
}
