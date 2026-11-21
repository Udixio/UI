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
    <!-- No @if: the card stays in the page, and hidden hides it once its exit has played. -->
    <div udxMotion="slide" [udxMotionPresent]="open()">Saved to your library</div>
  `,
})
export class Saved {
  protected readonly open = signal(true);
}
