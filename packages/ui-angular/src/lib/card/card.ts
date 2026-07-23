import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import {
  cardStyle,
  getCardKeyActivation,
  type CardInterface,
  type CardKeyPhase,
  type CardProps,
  type ClassNameComponent,
} from '@udixio/core';
import { createStyle } from '../utils/create-style';
import { StateLayer } from '../state-layer/state-layer';

/**
 * Cards display content and actions about a single subject
 * @status stable
 * @category Layout
 * @devx
 * - `href` renders the card as a native link and always applies the interactive treatment.
 * - `interactive` without `href` renders `role="button"` with `tabindex="0"` and Enter/Space activation; bind the action with `(click)`.
 * @a11y
 * - Actionable cards are focusable, expose native link or button semantics, and show a visible focus outline.
 * - The accessible name of an actionable card comes from its projected content; keep meaningful text inside it.
 * @limitations
 * - No built-in header/actions slots; layout is fully custom via projected content.
 * - An actionable card is one action target: do not nest interactive elements inside it; compose inner controls in a non-interactive card instead.
 */
@Component({
  selector: 'lib-card',
  standalone: true,
  imports: [NgTemplateOutlet, StateLayer],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <ng-template #content>
      @if (isInteractive()) {
        <lib-state-layer
          [className]="styles()['stateLayer']"
          colorName="on-surface"
          stateClassName="state-ripple-group-[card]"
        />
      }
      <ng-content />
    </ng-template>

    @if (href() !== undefined) {
      <a
        [class]="styles()['card']"
        [attr.href]="href()"
        [attr.target]="target()"
        [attr.rel]="rel()"
      >
        <ng-container [ngTemplateOutlet]="content" />
      </a>
    } @else if (isInteractive()) {
      <div
        [class]="styles()['card']"
        role="button"
        tabindex="0"
        (keydown)="handleKey($event, 'down')"
        (keyup)="handleKey($event, 'up')"
      >
        <ng-container [ngTemplateOutlet]="content" />
      </div>
    } @else {
      <div [class]="styles()['card']">
        <ng-container [ngTemplateOutlet]="content" />
      </div>
    }
  `,
})
export class Card {
  readonly variant = input<CardProps['variant']>('outlined');
  readonly interactive = input(false, { transform: booleanAttribute });

  /** Classes or state-aware element classes applied through the shared style contract. */
  readonly className = input<string | ClassNameComponent<CardInterface>>();

  /** Navigation URL. When defined, the component renders a native link. */
  readonly href = input<string>();

  /** Native link browsing-context target. */
  readonly target = input<string>();

  /** Native link relationship tokens. */
  readonly rel = input<string>();

  protected readonly isInteractive = computed(
    () => this.interactive() || this.href() !== undefined,
  );

  protected readonly styles = createStyle(cardStyle, () => ({
    variant: this.variant(),
    interactive: this.isInteractive(),
    className: this.className(),
  }));

  protected handleKey(event: KeyboardEvent, phase: CardKeyPhase): void {
    if (event.defaultPrevented) {
      return;
    }

    const decision = getCardKeyActivation({ key: event.key, phase });
    if (decision.preventScroll) {
      event.preventDefault();
    }
    if (decision.activate) {
      (event.currentTarget as HTMLElement).click();
    }
  }
}
