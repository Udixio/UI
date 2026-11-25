import {
  Component,
  effect,
  signal,
} from '@angular/core';
import { defineMotion } from '@udixio/motion';
import { Button, Motion } from '@udixio/ui-angular';

// Step 2: the motion, defined once by name.
defineMotion('toast', {
  verb: 'appear',
  keyframes: [
    { opacity: 0, y: 16, scale: 0.96 },
    { opacity: 1, y: 0, scale: 1 },
  ],
});

// The toast's look: an M3 snackbar with an action.
const toastClass = [
  'flex min-h-12 items-center gap-2 rounded',
  'bg-inverse-surface py-0.5 ps-4 pe-2',
  'text-body-medium text-inverse-on-surface',
].join(' ');

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
        <!-- Angular keeps it until its exit ends. -->
        @if (toast()) {
          <!-- Step 3: attached by its name. -->
          <div
            udxMotion="toast"
            [class]="toastClass"
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
  protected readonly toast = signal(false);
  protected readonly toastClass = toastClass;

  constructor() {
    // The toast leaves by itself after four seconds.
    effect((onCleanup) => {
      if (!this.toast()) return;
      const leave = () => this.toast.set(false);
      const timer = setTimeout(leave, 4000);
      onCleanup(() => clearTimeout(timer));
    });
  }
}
