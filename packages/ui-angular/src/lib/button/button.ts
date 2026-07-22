import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
} from '@angular/core';
import {
  buttonStyle,
  type ButtonProps,
  type ClassNameComponent,
  type ButtonInterface,
} from '@udixio/core';
import { createStyle } from '../utils/create-style';

/**
 * Exemple/référence : Button Angular consommant le cœur agnostique.
 * La plupart des props de ButtonProps sont des inputs réels, transmis avec
 * leur valeur (RequiredNullable l'impose). `activated` fait exception : il
 * n'a pas d'input dédié, il est dérivé de l'état interne `isActive`. `href`
 * est réservé au rendu lien (couche framework) mais n'est pas encore câblé
 * dans ce composant de référence — le template rend toujours `<button>`.
 */
@Component({
  selector: 'lib-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      [class]="styles()['button']"
      [attr.type]="type()"
      [disabled]="disabled()"
      [attr.aria-pressed]="onToggle() ? isActive() : null"
      (click)="handleClick()"
    >
      <span [class]="styles()['label']">{{ label() }}</span>
    </button>
  `,
})
export class Button {
  readonly type = input<NonNullable<ButtonProps['type']>>('button');
  readonly variant = input<ButtonProps['variant']>('filled');
  readonly size = input<ButtonProps['size']>('medium');
  readonly icon = input<ButtonProps['icon']>();
  readonly iconPosition = input<ButtonProps['iconPosition']>('left');
  readonly disabled = input<boolean>(false);
  readonly disableTextMargins = input<boolean>(false);
  readonly loading = input<boolean>(false);
  readonly shape = input<ButtonProps['shape']>('rounded');
  readonly allowShapeTransformation = input<boolean>(false);
  readonly label = input<string>('');
  readonly onToggle = input<ButtonProps['onToggle']>();
  readonly className = input<string | ClassNameComponent<ButtonInterface>>();
  readonly href = input<string>(); // binding de rendu (<a>/<button>)

  readonly toggled = output<boolean>();

  protected readonly isActive = signal(false);

  protected readonly styles = createStyle(buttonStyle, () => ({
    type: this.type(),
    variant: this.variant(),
    size: this.size(),
    icon: this.icon(),
    iconPosition: this.iconPosition(),
    disabled: this.disabled(),
    disableTextMargins: this.disableTextMargins(),
    loading: this.loading(),
    shape: this.shape(),
    allowShapeTransformation: this.allowShapeTransformation(),
    onToggle: this.onToggle(),
    activated: this.isActive(),
    label: this.label(),
    isActive: this.isActive(),
    className: this.className(),
  }));

  protected handleClick(): void {
    if (this.disabled() || !this.onToggle()) {
      return;
    }
    this.isActive.update((active) => !active);
    this.onToggle()?.(this.isActive());
    this.toggled.emit(this.isActive());
  }
}
