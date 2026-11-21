import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Button } from '@udixio/ui-angular';
import { iKeyboardArrowDown } from '@udixio/icons-rounded-400/keyboard_arrow_down';
import '@udixio/motion/presets';

const QUESTIONS = [
  { question: 'Can I return an order?', answer: 'Yes, within 30 days.' },
  { question: 'How long does delivery take?', answer: 'Two to four working days.' },
  { question: 'Do you ship abroad?', answer: 'Across the European Union.' },
];

// The question is a full-width text button; its chevron turns while the answer is open. The two class maps are
// constants, so the binding keeps the same object until the state changes.
const TRIGGER = 'w-full justify-between gap-4 rounded-2xl px-4 py-3 text-left text-title-small text-on-surface';
const CHEVRON = 'transition-[rotate] duration-200 motion-reduce:transition-none';

// connectMotion() runs once in your app (see Getting started): it plays the motion named in data-motion each time
// `hidden` changes. Every answer stays in the DOM, so it is in the server HTML and a search engine reads it.
@Component({
  selector: 'docs-motion-recipe-accordion-angular',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button],
  template: `
    <!-- reflow on each item: the items below glide to their new place as an answer opens or closes. -->
    <ul class="flex min-h-70 w-full max-w-96 flex-col gap-2 max-sm:min-h-80">
      @for (item of questions; track item.question; let index = $index) {
        <li data-motion="reflow" class="rounded-2xl bg-surface-container">
          <h3>
            <udx-button
              [id]="'faq-angular-q' + index"
              variant="text"
              size="small"
              [label]="item.question"
              [icon]="arrowIcon"
              iconPosition="end"
              [aria-expanded]="isOpen(index)"
              [aria-controls]="'faq-angular-a' + index"
              [classes]="isOpen(index) ? openClasses : closedClasses"
              (click)="toggle(index)"
            />
          </h3>
          <!-- Setting hidden plays the exit, then hides the answer; removing it plays the entry. -->
          <div
            [id]="'faq-angular-a' + index"
            role="region"
            [attr.aria-labelledby]="'faq-angular-q' + index"
            data-motion="fade"
            [hidden]="!isOpen(index)"
            class="px-4 pb-4 text-body-medium text-on-surface-variant"
          >
            {{ item.answer }}
          </div>
        </li>
      }
    </ul>
  `,
})
export class MotionRecipeAccordionAngular {
  protected readonly questions = QUESTIONS;
  protected readonly arrowIcon = iKeyboardArrowDown;
  protected readonly closedClasses = { button: TRIGGER, icon: CHEVRON };
  protected readonly openClasses = { button: TRIGGER, icon: `${CHEVRON} rotate-180` };
  // One answer open at a time: opening one closes the other.
  private readonly expanded = signal<number | null>(null);

  protected isOpen(index: number): boolean {
    return this.expanded() === index;
  }

  protected toggle(index: number): void {
    this.expanded.update((current) => (current === index ? null : index));
  }
}
