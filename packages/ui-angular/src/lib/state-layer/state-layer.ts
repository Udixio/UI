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
        'var(--default-color, var(--color-' + colorName() + '))'
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
