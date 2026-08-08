import { createLayout } from 'animejs';

function systemPrefersReducedMotion(): boolean {
  return (
    typeof globalThis.matchMedia === 'function' &&
    globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export interface TextFieldLabelControllerOptions {
  /**
   * The outlined variant's `<legend>` element itself -- not the field's
   * bordered content container. `width: auto` cannot be CSS-transitioned,
   * which is the one genuine layout-diffing problem here; scope the Layout
   * root this narrowly so it never also measures the content container's
   * own, unrelated CSS transitions (the active indicator's width, the
   * border's width/color on focus). A wider root would still work most of
   * the time, but Anime.js Layout re-measures and re-animates every
   * descendant under `root`, so it would intermittently fight those other
   * transitions -- visible as a stray width/position glitch on the field
   * itself.
   */
  root: HTMLElement;
  reducedMotion?: () => boolean;
  duration?: number;
}

export interface TextFieldLabelController {
  /** Animates from the layout recorded by the last completed transition (or mount) to the current one. */
  update(): void;
  destroy(): void;
}

/**
 * Animates the outlined variant's legend notch between its collapsed
 * (`width: 0`) and content-sized (`width: auto`) states using Anime.js's
 * Layout (Auto Layout) engine, the same accepted per-component exception to
 * the shared Motion controller convention documented on
 * `createSwitchThumbController` (see `docs/component-behavior.md`):
 * `width: auto` cannot be CSS-transitioned, and Motion's free tier has no
 * equivalent before/after layout diffing (`animateLayout` is a paid Motion+
 * feature), so a second, framework-specific reimplementation (previously
 * `motion/react`'s `layoutId`) would inevitably derive from this one. The
 * floating label itself is a plain CSS transition (its start/end values are
 * always concrete, not `auto`), same as every other property here. Both
 * React and Angular adapters use this same controller, scoped to the
 * `<legend>` alone (see `root`), and only own mount lifecycle wiring and
 * calling `update()` after a floating-state change.
 */
export function createTextFieldLabelController({
  root,
  reducedMotion = systemPrefersReducedMotion,
  duration = 200,
}: TextFieldLabelControllerOptions): TextFieldLabelController {
  const layout = createLayout(root);
  layout.record();

  return {
    update() {
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
        ease: 'outCubic',
        onComplete: () => layout.record(),
      });
    },
    destroy() {
      layout.timeline?.cancel();
    },
  };
}
