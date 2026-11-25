import { Component, signal } from '@angular/core';
import { Motion } from '@udixio/ui-angular';
import '@udixio/motion/presets';

@Component({
  selector: 'docs-card',
  imports: [Motion],
  template: `
    <!-- A layout motion does not observe the inline style. udxMotionState is the value that changes with it: each new
      value plays the move, once the new width is applied. -->
    <div
      udxMotion="reflow"
      [udxMotionState]="wide()"
      [style.width]="wide() ? '100%' : '50%'"
      class="h-16 rounded-2xl bg-primary"
      (click)="wide.set(!wide())"
    ></div>
  `,
})
export class Card {
  protected readonly wide = signal(false);
}
