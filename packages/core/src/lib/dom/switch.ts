import { animate, type JSAnimation } from 'animejs';

function systemPrefersReducedMotion(): boolean {
  return (
    typeof globalThis.matchMedia === 'function' &&
    globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export interface SwitchThumbControllerOptions {
  /** The handle container (`.handle-container`) whose `translate` slides between resting offsets. */
  root: HTMLElement;
  reducedMotion?: () => boolean;
  duration?: number;
}

export interface SwitchThumbController {
  /** Slides `root`'s `translate` from `from` to `to` (both px, see `getSwitchHandleOffset`). */
  update(from: number, to: number): void;
  destroy(): void;
}

/**
 * Slides a `Switch` thumb between its resting `translate` offsets (see
 * `getSwitchHandleOffset`) with a plain Anime.js tween, an accepted
 * per-component exception to the shared Motion controller convention (see
 * `docs/component-behavior.md`): Motion has no free equivalent to automatic
 * before/after layout diffing (its `animateLayout` is a paid Motion+
 * feature). Both React and Angular adapters use this same controller and
 * only own mount lifecycle wiring.
 *
 * This intentionally does *not* use Anime.js's `Layout` (Auto Layout)
 * engine, despite that being the reason Anime.js was brought in for this
 * component in the first place. A switch only ever has two resting
 * positions, both fully known ahead of time from `getSwitchHandleOffset` --
 * there's nothing to *measure*, so there's no need for FLIP-style
 * before/after DOM diffing. That distinction matters because `Layout`'s
 * diffing comes with real, unavoidable side effects: its `record()`
 * baseline is measured from `getBoundingClientRect()`, so it can go stale
 * from *any* unrelated layout shift between mount and first use (this broke
 * once already, from an unrelated doc-site sidebar CLS); and it walks and
 * registers every DOM descendant of `root` regardless of the `children`
 * option, forcibly overwriting non-target descendants' colors mid-timeline
 * (`.handle`'s checked-state color swap was getting frozen and snapped
 * partway through the slide). A plain tween of one known-good numeric
 * `translate` value to another sidesteps both classes of bug entirely: it
 * never measures the DOM, and it only ever touches `root` itself.
 */
export function createSwitchThumbController({
  root,
  reducedMotion = systemPrefersReducedMotion,
  duration = 150,
}: SwitchThumbControllerOptions): SwitchThumbController {
  let animation: JSAnimation | null = null;

  return {
    update(from, to) {
      animation?.cancel();
      if (reducedMotion()) {
        root.style.translate = `${to}px`;
        return;
      }
      animation = animate(root, {
        translate: [from, to],
        duration,
        ease: 'inQuart',
      });
    },
    destroy() {
      animation?.cancel();
    },
  };
}
