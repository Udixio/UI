import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { defineMotion } from '@udixio/motion';
import { Button, Motion } from '@udixio/ui-angular';

// 1. Define, once, in a module: the motion is registered under its name, for the whole page.
defineMotion('toast-in', {
  verb: 'appear',
  keyframes: [
    { opacity: 0, y: 16 },
    { opacity: 1, y: 0 },
  ],
});

// A toast that enters when it is rendered, and leaves before it is removed.
@Component({
  selector: 'app-save-to-library',
  standalone: true,
  imports: [Button, Motion],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-start gap-4">
      <udx-button
        [label]="saved() ? 'Remove from library' : 'Save to library'"
        (click)="saved.set(!saved())"
      />
      <div role="status">
        <!-- 2. Attach: udxMotion binds the motion to its element. -->
        <!-- 3. Trigger: @if adds it, and its entry plays; Angular removes it once its exit has played. -->
        @if (saved()) {
          <p udxMotion="toast-in">Saved to your library</p>
        }
      </div>
    </div>
  `,
})
export class SaveToLibrary {
  protected readonly saved = signal(false);
}
