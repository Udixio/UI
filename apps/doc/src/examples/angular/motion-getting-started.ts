import { Component, signal } from '@angular/core';
import { Button, Motion } from '@udixio/ui-angular';
import './motion-toast'; // Step 2: the motion.

@Component({
  selector: 'docs-motion-getting-started-angular',
  imports: [Button, Motion],
  template: `
    <div class="flex flex-col items-center gap-6">
      <udx-button
        size="small"
        label="Save to library"
        (click)="toast.set(true)"
      />
      <!-- A live region: the toast is announced. -->
      <div role="status" class="h-12">
        @if (toast()) {
          <!-- Step 3: attached by its name. -->
          <div
            udxMotion="toast"
            class="flex min-h-12 items-center gap-2
              rounded bg-inverse-surface py-0.5 ps-4
              pe-2 text-body-medium
              text-inverse-on-surface"
          >
            Saved to your library
            <!-- Undo: the toast leaves at once. -->
            <udx-button
              variant="text"
              size="small"
              label="Undo"
              class="text-inverse-primary"
              stateColor="inverse-primary"
              (click)="toast.set(false)"
            />
          </div>
        }
      </div>
    </div>
  `,
})
export class MotionGettingStartedAngular {
  // Angular keeps the toast until its exit ends.
  protected readonly toast = signal(false);
}
