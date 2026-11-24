import { Component, effect, signal } from '@angular/core';
import { Button, Motion } from '@udixio/ui-angular';
import '@udixio/motion/presets';

@Component({
  selector: 'docs-motion-presence-angular',
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
        <!-- Angular keeps it until its exit has played. -->
        @if (toast()) {
          <div
            udxMotion="slide"
            class="rounded bg-inverse-surface px-4 py-3.5 text-body-medium text-inverse-on-surface"
          >
            Saved to your library
          </div>
        }
      </div>
    </div>
  `,
})
export class MotionPresenceAngular {
  protected readonly toast = signal(false);

  constructor() {
    // The toast leaves by itself after four seconds.
    effect((onCleanup) => {
      if (!this.toast()) return;
      const timer = setTimeout(() => this.toast.set(false), 4000);
      onCleanup(() => clearTimeout(timer));
    });
  }
}
