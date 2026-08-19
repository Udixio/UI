import { createLayout, type EasingParam } from 'animejs';

function systemPrefersReducedMotion(): boolean {
  return (
    typeof globalThis.matchMedia === 'function' &&
    globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export interface AutoLayoutControllerOptions {
  /**
   * Element whose own layout is diffed. Keep this scope as narrow as the
   * effect requires: Anime.js Layout re-measures and re-animates every
   * descendant under `root`, so a wider root intermittently fights the CSS
   * transitions those descendants run themselves.
   */
  root: HTMLElement;
  reducedMotion?: () => boolean;
  /** Transition duration, in milliseconds. */
  duration?: number;
  ease?: EasingParam;
}

export interface AutoLayoutController {
  /**
   * Animates from the layout recorded by the last completed transition (or
   * mount) to the current one.
   *
   * Pass `mutate` whenever the caller owns the DOM change itself: the
   * layout is then re-recorded immediately before it, which is the only
   * interruption-safe form (see the note on `createAutoLayoutController`).
   * The no-argument form is for callers whose change has already been
   * applied declaratively by the time they can call this.
   */
  update(mutate?: () => void): void;
  destroy(): void;
}

/**
 * Wraps Anime.js's Layout (Auto Layout) engine in the record/animate/record
 * cycle every layout-diffed effect needs, and owns the one third-party
 * workaround they all need with it (see `update()`).
 *
 * This is the shared half of the accepted per-component exception to the
 * Motion controller convention documented in `docs/component-behavior.md`:
 * `width: auto` cannot be CSS-transitioned, and Motion's free tier has no
 * equivalent before/after layout diffing (`animateLayout` is a paid Motion+
 * feature). Callers own *what* is diffed and *when*; a framework adapter
 * never talks to this directly, only to the component controller built on
 * it (`createTextFieldLabelController`, `createFabLabelController`).
 *
 * Callers that own their DOM change should pass it to `update()` as a
 * callback. That is the interruption-safe form, and the reason is entirely in
 * Anime.js's `record()`: it measures the live geometry *first*, and only then
 * cancels the running timeline and restores the inline styles the animation
 * had pinned (`layout.js`, `AutoLayout.record`). Calling `animate()` again
 * without it leaves those pins -- an absolute `width`/`height` in px,
 * `position: relative`, `translate`, and a muted `transition` -- applied for
 * good, because only a completed timeline restores them. A component whose
 * state can flip mid-transition (a toggled FAB, say) would freeze at whatever
 * pixel width it happened to be interrupted at, and no later change of class
 * or style could recover it.
 *
 * A caller whose change has already been applied for it -- declaratively,
 * through the shared style contract -- cannot use that form: re-recording
 * after the fact would just capture the target as the baseline and animate
 * nothing. It calls `update()` with no argument and accepts that an
 * interrupted transition is not recoverable.
 */
export function createAutoLayoutController({
  root,
  reducedMotion = systemPrefersReducedMotion,
  duration = 200,
  ease = 'outCubic',
}: AutoLayoutControllerOptions): AutoLayoutController {
  const layout = createLayout(root);
  layout.record();

  return {
    update(mutate?: () => void) {
      if (mutate) {
        layout.record();
        mutate();
      }
      if (reducedMotion()) {
        layout.record();
        return;
      }
      // Anime.js's Layout module restores the page's scroll position to
      // whatever it was at the last record() call if it differs at
      // animate()-time (dist/modules/layout/layout.js: a guarded
      // `requestAnimationFrame(() => window.scrollTo(oldState.scrollX,
      // oldState.scrollY))`), to protect a transition from an incidental
      // scroll caused by the same DOM mutation. record() only runs once,
      // at mount, and update() can fire arbitrarily later, so by then the
      // scroll position has usually legitimately moved -- read by Anime.js
      // as "incidental" and silently reverted, yanking the whole page back
      // to wherever it was at mount. There is no public option to disable
      // this, so the internal scroll baseline is synced to the current
      // scroll position immediately before animate(), which makes Anime.js
      // see no delta and skip the revert.
      layout.oldState.scrollX = window.scrollX;
      layout.oldState.scrollY = window.scrollY;
      layout.animate({
        duration,
        ease,
        onComplete: () => layout.record(),
      });
    },
    destroy() {
      layout.timeline?.cancel();
    },
  };
}
