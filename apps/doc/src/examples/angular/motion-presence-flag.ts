import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Motion } from '@udixio/ui-angular';
import '@udixio/motion/presets';

// A card that stays in the DOM: [udxMotionPresent] plays its exit and its entry.
@Component({
  selector: 'app-saved',
  standalone: true,
  imports: [Motion],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" (click)="open.set(!open())">{{ open() ? 'Hide' : 'Show' }}</button>
    <!-- No @if: once its exit has played, the card stays, transparent and inert. -->
    <div udxMotion="slide" [udxMotionPresent]="open()">Saved to your library</div>
  `,
})
export class Saved {
  protected readonly open = signal(true);
}
