import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { defineMotion } from '@udixio/motion';
import { Button, Motion } from '@udixio/ui-angular';

// Defined once, by name, before the template uses it: the card is attached to it by that name.
defineMotion('card-enter', {
  verb: 'appear',
  keyframes: [
    { opacity: 0, y: 24 },
    { opacity: 1, y: 0 },
  ],
  timing: 'spring.default.spatial',
});

@Component({
  selector: 'docs-motion-getting-started-define-angular',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Motion],
  template: `
    <div class="flex flex-col items-start gap-4">
      @if (open()) {
        <div udxMotion="card-enter">Fades in and rises</div>
      }
      <udx-button size="small" [label]="open() ? 'Hide' : 'Show'" (click)="open.set(!open())" />
    </div>
  `,
})
export class MotionGettingStartedAngular {
  // The card is in the template while `open` is true: Angular keeps it until its exit has played.
  protected readonly open = signal(true);
}
