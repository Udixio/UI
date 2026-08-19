import {
  createAutoLayoutController,
  type AutoLayoutController,
} from './auto-layout.js';

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

export type TextFieldLabelController = AutoLayoutController;

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
 *
 * The record/animate/record cycle and Anime.js's scroll-restoration
 * workaround live in `createAutoLayoutController`, shared with every other
 * layout-diffed effect.
 */
export function createTextFieldLabelController({
  root,
  reducedMotion,
  duration = 200,
}: TextFieldLabelControllerOptions): TextFieldLabelController {
  return createAutoLayoutController({
    root,
    reducedMotion,
    duration,
    ease: 'outCubic',
  });
}
