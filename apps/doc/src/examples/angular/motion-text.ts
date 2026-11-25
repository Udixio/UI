import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Button, Motion } from '@udixio/ui-angular';
import { defineMotion } from '@udixio/motion';

// Each word rises and fades in, in turn. A line plays again when it becomes the current one.
defineMotion('headline', {
  verb: 'reveal',
  split: 'words',
  reduced: 'fade',
  keyframes: [
    { opacity: 0, y: 12 },
    { opacity: 1, y: 0 },
  ],
});

const LINES = [
  'Every word arrives in turn, and is read once.',
  'The light comes in slowly, one word at a time.',
  'Let the last word settle.',
];

@Component({
  selector: 'docs-motion-text-angular',
  standalone: true,
  imports: [Button, Motion],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-start gap-4">
      <!-- One paragraph per line: the others stay hidden, and their words are not rewritten. -->
      @for (text of lines; track text; let index = $index) {
        <p
          udxMotion="headline"
          [udxMotionState]="line() === index"
          [class.hidden]="line() !== index"
          class="text-headline-medium text-on-surface"
        >
          {{ text }}
        </p>
      }
      <udx-button size="small" label="Next line" (click)="next()" />
    </div>
  `,
})
export class MotionTextAngular {
  protected readonly lines = LINES;
  protected readonly line = signal(0);

  protected next(): void {
    this.line.update((line) => (line + 1) % LINES.length);
  }
}
