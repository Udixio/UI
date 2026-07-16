import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { buttonStyle, type ButtonProps } from '@udixio/core';

/**
 * Exemple minimal de consommation du cœur agnostique depuis Angular.
 *
 * Ce composant n'a AUCUNE dépendance React : il importe directement la
 * fonction pure `buttonStyle` et le type `ButtonProps` de `@udixio/core`,
 * et obtient exactement les mêmes classes Tailwind que `@udixio/ui-react`.
 * La seule couche « framework » ici est la liaison entre les inputs Angular
 * et l'objet d'état passé à `buttonStyle`.
 */
@Component({
  selector: 'lib-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      [class]="styles().button"
      [attr.type]="type()"
      [disabled]="disabled()"
      [attr.aria-pressed]="toggleable() ? isActive() : null"
      (click)="handleClick()"
    >
      <span [class]="styles().label">{{ label() }}</span>
    </button>
  `,
})
export class Button {
  // Props agnostiques (typées directement depuis ButtonProps du cœur)
  readonly variant = input<ButtonProps['variant']>('filled');
  readonly size = input<ButtonProps['size']>('medium');
  readonly shape = input<ButtonProps['shape']>('rounded');
  readonly disabled = input<boolean>(false);
  readonly label = input<string>('');
  readonly type = input<NonNullable<ButtonProps['type']>>('button');
  /** Si vrai, le bouton se comporte comme un toggle (état `isActive`). */
  readonly toggleable = input<boolean>(false);

  /** Émis à chaque bascule quand `toggleable` est activé. */
  readonly toggled = output<boolean>();

  // État d'interaction (équivalent du `state` isActive côté React).
  protected readonly isActive = signal(false);

  /**
   * Calcul réactif des classes : un simple appel à la fonction pure du cœur.
   * On fournit toutes les clés de `ButtonProps` (+ `isActive` + `className`)
   * attendues par la signature de `buttonStyle`.
   */
  protected readonly styles = computed(() =>
    buttonStyle({
      variant: this.variant(),
      size: this.size(),
      shape: this.shape(),
      disabled: this.disabled(),
      label: this.label(),
      type: this.type(),
      isActive: this.isActive(),
      activated: this.isActive(),
      href: undefined,
      onToggle: this.toggleable() ? () => undefined : undefined,
      disableTextMargins: undefined,
      loading: undefined,
      allowShapeTransformation: undefined,
      className: undefined,
    }),
  );

  protected handleClick(): void {
    if (this.disabled() || !this.toggleable()) {
      return;
    }
    this.isActive.update((active) => !active);
    this.toggled.emit(this.isActive());
  }
}
