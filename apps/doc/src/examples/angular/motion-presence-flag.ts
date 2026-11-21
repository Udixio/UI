import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Button, Motion } from '@udixio/ui-angular';
import '@udixio/motion/presets';

// A card that stays in the DOM: [udxMotionPresent] plays its exit and its entry.
@Component({
  selector: 'app-saved',
  standalone: true,
  imports: [Button, Motion],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-start gap-4">
      <!-- aria-expanded and aria-controls tell assistive technology that the button shows and hides the card. -->
      <udx-button
        size="small"
        [label]="open() ? 'Hide' : 'Show'"
        [aria-expanded]="open()"
        aria-controls="saved-card-angular"
        (click)="open.set(!open())"
      />
      <!-- No @if: the card stays in the page, and hidden hides it once its exit has played. -->
      <div id="saved-card-angular" udxMotion="slide" [udxMotionPresent]="open()">Saved to your library</div>
    </div>
  `,
})
export class Saved {
  protected readonly open = signal(true);
}
