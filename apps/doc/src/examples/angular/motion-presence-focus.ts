import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Motion } from '@udixio/ui-angular';
import '@udixio/motion/presets';

// A panel that leaves with focus inside it: its exit gives focus back to the button that opened it.
@Component({
  selector: 'app-filters',
  standalone: true,
  imports: [Motion],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button #opener type="button" [attr.aria-expanded]="open()" (click)="open.set(true)">
      Filters
    </button>
    @if (open()) {
      <!-- Focus is on Close: the exit moves it to the Filters button before the panel turns inert. -->
      <div udxMotion="fade" [udxMotionRestoreFocus]="opener">
        <button type="button" (click)="open.set(false)">Close</button>
      </div>
    }
  `,
})
export class Filters {
  protected readonly open = signal(false);
}
