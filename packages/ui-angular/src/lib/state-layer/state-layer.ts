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
 * - The trigger is resolved by walking up to the outermost ancestor carrying
 *   the named Tailwind group, so the layer must be rendered inside it.
 * - The set of valid `colorName` tokens lives in `@udixio/theme`, which
 *   `@udixio/core` does not depend on, so the prop is typed as `string`.
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
    ></span>
  `,
})
export class StateLayer {
  readonly colorName = input.required<StateLayerProps['colorName']>();
  readonly stateClassName =
    input<NonNullable<StateLayerProps['stateClassName']>>('state-ripple-group');
  readonly className = input<
    string | ClassNameComponent<StateLayerInterface>
  >();
  readonly shapeTransition = input<StateLayerProps['shapeTransition']>();

  private readonly layer = viewChild.required<ElementRef<HTMLElement>>('layer');
  private controller?: StateLayerController;

  protected readonly styles = createStyle(stateLayerStyle, () => ({
    colorName: this.colorName(),
    stateClassName: this.stateClassName(),
    shapeTransition: this.shapeTransition(),
    className: this.className(),
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
