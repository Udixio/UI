import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  untracked,
  viewChild,
} from '@angular/core';
import {
  stateLayerStyle,
  type ClassNameComponent,
  type ElementClasses,
  mergeClassNames,
  type StateLayerInterface,
  type StateLayerProps,
} from '@udixio/core';
import {
  createStateLayerController,
  findStateLayerTrigger,
  type StateLayerController,
} from '@udixio/core/dom';
import { createStyle } from '../utils/create-style';

/**
 * Paints the Material 3 state layer over its trigger, and drives the press
 * ripple.
 *
 * @status beta
 * @category Interaction
 * @devx
 * - Building block used by every interactive component (`Button`, `Chip`, `Switch`, ...); it is
 *   rendered inside the element it decorates, never standalone.
 * - `colorName` is a theme token without the `--color-` prefix, and it is the
 *   content colour of the surface being decorated -- `on-primary` on a filled
 *   button, `on-primary-container` once that button is repainted onto a
 *   container. An unknown token degrades to `on-surface`.
 * - `stateClassName` selects the Tailwind utility driving the CSS states. The
 *   `state-ripple-group-[name]` form pairs with a `group/name` class on the
 *   trigger, and the layer attaches its ripple to that same element, so the
 *   CSS states and the JavaScript gesture always agree on what the trigger is.
 * - `state-layer` (the non-group form) is CSS-only: no ripple is wired.
 * @a11y
 * - Decorative only: the layer carries `aria-hidden` and takes no pointer
 *   events, so it never reaches the accessibility tree nor intercepts input.
 * - The press ripple honours the reduced-motion preference through the shared
 *   controller.
 * @limitations
 * - Must be rendered inside the element carrying the named Tailwind group,
 *   which is the trigger it attaches to.
 * - `colorName` is typed as `string`: the valid tokens are not visible from
 *   here, so a typo degrades to `on-surface` instead of failing to compile.
 * - `classes` takes the state-aware function form, but it resolves no
 *   interaction states -- hover, focus and press live in the Tailwind
 *   utilities, not in JavaScript.
 * - `[class.x]` and `[ngClass]` bind to the `display: contents` host and have no visible effect; use `class`, `[class]`, or `classes`.
 */
@Component({
  selector: 'udx-state-layer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents; border-radius: inherit' },
  template: `
    <span
      #layer
      aria-hidden="true"
      [class]="styles()['stateLayer']"
      [style.--state-color]="
        'var(--color-' + colorName() + ', var(--color-on-surface))'
      "
      [style.transition]="
        transitionDuration() === undefined ? null : transitionDuration() + 's'
      "
    ></span>
  `,
})
export class StateLayer {
  readonly colorName = input.required<StateLayerProps['colorName']>();
  readonly stateClassName =
    input<NonNullable<StateLayerProps['stateClassName']>>('state-ripple-group');
  /** Classes applied to the root element. Angular's native `class` attribute and `[class]` binding land here, merged with the component's own classes. */
  readonly hostClass = input<string>('', { alias: 'class' });

  /** Static or state-aware classes for the component's internal elements, keyed by element name. */
  readonly classes = input<
    ElementClasses<StateLayerInterface> | ClassNameComponent<StateLayerInterface>
  >();
  readonly shapeTransition = input<StateLayerProps['shapeTransition']>();
  readonly transitionDuration =
    input<StateLayerProps['transitionDuration']>();

  private readonly layer = viewChild.required<ElementRef<HTMLElement>>('layer');
  private controller?: StateLayerController;

  protected readonly styles = createStyle(stateLayerStyle, () => ({
    colorName: this.colorName(),
    stateClassName: this.stateClassName(),
    shapeTransition: this.shapeTransition(),
    transitionDuration: this.transitionDuration(),
    className: mergeClassNames<StateLayerInterface>(
      'stateLayer',
      this.classes(),
      this.hostClass(),
    ),
  }));

  constructor() {
    afterRenderEffect((onCleanup) => {
      const layer = this.layer().nativeElement;
      const trigger = findStateLayerTrigger(layer, this.stateClassName());
      if (!trigger) {
        return;
      }

      const controller = createStateLayerController({
        trigger,
        layer,
        disabled: () => trigger.matches(':disabled, [aria-disabled="true"]'),
      });
      this.controller = controller;
      controller.updateShape(untracked(this.shapeTransition));

      onCleanup(() => {
        controller.destroy();
        if (this.controller === controller) {
          this.controller = undefined;
        }
      });
    });

    afterRenderEffect(() => {
      this.controller?.updateShape(this.shapeTransition());
    });
  }
}
