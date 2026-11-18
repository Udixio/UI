import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MotionValue } from '@udixio/ui-angular';
import { defineValue } from '@udixio/motion/value';

// A counter: a state value with a format, written as its number and as the text of its element.
defineValue('visitors-count', {
  source: 'state',
  format: 'integer',
  range: [0, 100000],
});

@Component({
  selector: 'docs-motion-values-angular',
  standalone: true,
  imports: [MotionValue],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-start gap-4">
      <data
        udxMotionValue="visitors-count"
        [attr.value]="visitors()"
        class="block text-display-small text-on-surface"
      >12480</data>
      <button
        type="button"
        (click)="visitors.update((value) => value + 1000)"
        class="rounded-full bg-primary px-6 py-2.5 text-label-large text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
      >
        Add 1,000 visitors
      </button>
    </div>
  `,
})
export class MotionValuesAngular {
  // Angular writes the value attribute; the runtime counts to the new number. The text is left to the runtime.
  protected readonly visitors = signal(12480);
}
