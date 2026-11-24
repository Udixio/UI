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
      <!-- The motion goes on the component itself: the shake moves the whole field, not only its input. -->
      <udx-text-field
        udxMotion="shake"
        [udxMotionState]="refusals()"
        label="Code"
        [value]="code()"
        (valueChange)="code.set($event)"
        [errorText]="invalid() ? 'Not this code' : null"
      />
      <udx-button udxMotion="press" [udxMotionState]="checks()" type="submit" size="small" label="Check" />
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
