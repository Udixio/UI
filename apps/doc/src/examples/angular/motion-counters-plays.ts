import {
  ChangeDetectionStrategy,
  Component,
  signal,
} from '@angular/core';
import { defineValue } from '@udixio/motion/value';
import {
  Button,
  MotionValue,
} from '@udixio/ui-angular';

// A counter: a state value with a format. Its
// number is the value attribute of its element,
// and its text follows it.
defineValue('plays', {
  source: 'state',
  format: 'integer',
  range: [0, 100000],
});

@Component({
  selector: 'docs-motion-counters-plays-angular',
  imports: [Button, MotionValue],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-start gap-4">
      <data
        udxMotionValue="plays"
        [attr.value]="plays()"
        class="block text-display-small
          text-on-surface"
      >12,480</data>
      <udx-button
        size="small"
        label="Add 1,000 plays"
        (click)="plays.update((n) => n + 1000)"
      />
    </div>
  `,
})
export class MotionCountersPlaysAngular {
  // Angular writes the value attribute; the runtime
  // counts to the new number and writes the text.
  protected readonly plays = signal(12480);
}
