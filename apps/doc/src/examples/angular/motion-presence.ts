import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Motion } from '@udixio/ui-angular';
import '@udixio/motion/presets';

@Component({
  selector: 'docs-motion-presence-angular',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Motion],
  template: `
    <div class="flex flex-col items-start gap-4">
      <button
        type="button"
        (click)="toggle()"
        class="rounded-full bg-primary px-6 py-2.5 text-label-large text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
      >
        Toggle Angular card
      </button>
      @if (open()) {
        <div
          udxMotion="slide"
          data-demo-card="angular"
          class="rounded-2xl bg-surface-container-high p-6"
        >
          <h3 class="text-title-medium text-on-surface">Angular</h3>
          <p class="text-body-medium text-on-surface-variant">Mounted and unmounted by Angular.</p>
        </div>
      }
    </div>
  `,
})
export class MotionPresenceAngular {
  // The card is in the template while `open` is true; Angular keeps it until its exit has played.
  protected readonly open = signal(true);

  protected toggle(): void {
    this.open.update((value) => !value);
  }
}
