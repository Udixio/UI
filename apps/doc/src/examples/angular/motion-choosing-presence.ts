import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Button, Motion } from '@udixio/ui-angular';
import '@udixio/motion/presets';

@Component({
  selector: 'app-saved-and-details',
  standalone: true,
  imports: [Button, Motion],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-start gap-4">
      <div class="flex flex-wrap gap-2">
        <udx-button size="small" label="Save" (click)="saved.set(true)" />
        <udx-button
          size="small"
          variant="tonal"
          [label]="open() ? 'Hide details' : 'Show details'"
          [aria-expanded]="open()"
          aria-controls="details-angular"
          (click)="open.set(!open())"
        />
      </div>
      <!-- Transient: @if removes the toast once its exit has played. -->
      <div aria-live="polite">
        @if (saved()) {
          <div udxMotion="slide" class="flex items-center gap-2">
            Saved to your library
            <udx-button size="small" variant="text" label="Dismiss" (click)="saved.set(false)" />
          </div>
        }
      </div>
      <!-- Content: no @if. The panel stays in the DOM, hidden while closed, so its text is in the server HTML. -->
      <div id="details-angular" udxMotion="fade" [udxMotionPresent]="open()">
        Recorded live in 1977, remastered in 2019.
      </div>
    </div>
  `,
})
export class SavedAndDetails {
  protected readonly saved = signal(false);
  protected readonly open = signal(false);
}
