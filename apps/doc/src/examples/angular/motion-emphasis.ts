import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Button, Motion, TextField } from '@udixio/ui-angular';
import '@udixio/motion/presets';

@Component({
  selector: 'docs-motion-emphasis-angular',
  standalone: true,
  imports: [Button, Motion, TextField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Enter in the field submits the form, as Check does. -->
    <form (submit)="submit($event)" class="flex flex-col items-start gap-4">
      <!-- Each motion sits on a plain wrapper, around the component it moves. -->
      <div udxMotion="shake" [udxMotionState]="refusals()">
        <udx-text-field
          label="Code"
          [value]="code()"
          (valueChange)="code.set($event)"
          [errorText]="invalid() ? 'Not this code' : null"
        />
      </div>
      <span udxMotion="press" [udxMotionState]="checks()" class="inline-flex">
        <udx-button type="submit" size="small" label="Check" />
      </span>
    </form>
  `,
})
export class MotionEmphasisAngular {
  protected readonly code = signal('');
  // Each new value of a count replays its emphasis.
  protected readonly checks = signal(0);
  protected readonly refusals = signal(0);
  protected readonly invalid = signal(false);

  protected submit(event: Event): void {
    event.preventDefault();
    this.checks.update((value) => value + 1);
    this.invalid.set(this.code() !== '1234');
    if (this.invalid()) this.refusals.update((value) => value + 1);
  }
}
