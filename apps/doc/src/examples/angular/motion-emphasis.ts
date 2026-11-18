import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Motion } from '@udixio/ui-angular';
import '@udixio/motion/presets';

@Component({
  selector: 'docs-motion-emphasis-angular',
  standalone: true,
  imports: [Motion],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-start gap-4">
      <input
        udxMotion="shake"
        [udxMotionState]="refusals()"
        [attr.aria-invalid]="invalid()"
        [value]="code()"
        (input)="code.set($any($event.target).value)"
        (keydown.enter)="submit()"
        class="rounded-xl border border-outline bg-surface-container-lowest px-4 py-2 text-on-surface"
      />
      <button
        type="button"
        udxMotion="press"
        [udxMotionState]="checks()"
        (click)="submit()"
        class="rounded-full bg-primary px-6 py-2.5 text-label-large text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
      >
        Check
      </button>
    </div>
  `,
})
export class MotionEmphasisAngular {
  protected readonly code = signal('');
  // Each new value of a count replays its emphasis.
  protected readonly checks = signal(0);
  protected readonly refusals = signal(0);
  protected readonly invalid = signal(false);

  protected submit(): void {
    this.checks.update((value) => value + 1);
    this.invalid.set(this.code() !== '1234');
    if (this.invalid()) this.refusals.update((value) => value + 1);
  }
}
