import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Icon } from '@udixio/ui-angular';
import { iKeyboardArrowDown } from '@udixio/icons-rounded-400/keyboard_arrow_down';
import '@udixio/motion/presets';

const QUESTIONS = [
  { question: 'Can I return an order?', answer: 'Yes, within 30 days.' },
  { question: 'How long does delivery take?', answer: 'Two to four working days.' },
  { question: 'Do you ship abroad?', answer: 'Across the European Union.' },
];

// connectMotion() runs once in your app (see Getting started): it plays the motion named in data-motion each time
// `hidden` changes. Every answer stays in the DOM, so it is in the server HTML and a search engine reads it.
@Component({
  selector: 'docs-motion-recipe-accordion-angular',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    <!-- reflow on each item: the items below glide to their new place as an answer opens or closes. -->
    <ul class="flex min-h-70 w-full max-w-96 flex-col gap-2 max-sm:min-h-80">
      @for (item of questions; track item.question; let index = $index) {
        <li data-motion="reflow" class="rounded-2xl bg-surface-container">
          <h3>
            <button
              type="button"
              [id]="'faq-angular-q' + index"
              [attr.aria-expanded]="isOpen(index)"
              [attr.aria-controls]="'faq-angular-a' + index"
              (click)="toggle(index)"
              class="flex w-full items-center justify-between gap-4 rounded-2xl px-4 py-3 text-left text-title-small text-on-surface focus-visible:outline-2 focus-visible:outline-primary"
            >
              {{ item.question }}
              <span aria-hidden="true" class="flex transition-[rotate] duration-200 motion-reduce:transition-none" [class.rotate-180]="isOpen(index)">
                <udx-icon [icon]="arrowIcon" />
              </span>
            </button>
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
  // One answer open at a time: opening one closes the other.
  private readonly expanded = signal<number | null>(null);

  protected isOpen(index: number): boolean {
    return this.expanded() === index;
  }

  protected toggle(index: number): void {
    this.expanded.update((current) => (current === index ? null : index));
  }
}
