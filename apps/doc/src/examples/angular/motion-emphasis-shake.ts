import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Button, Motion, TextField } from '@udixio/ui-angular';
import '@udixio/motion/presets';

@Component({
  selector: 'docs-motion-emphasis-shake-angular',
  standalone: true,
  imports: [Button, Motion, TextField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form (submit)="submit($event)" class="flex flex-col items-start gap-4">
      <!-- The motion goes on the component itself: the shake moves the whole field, not only its input. -->
      <udx-text-field
        udxMotion="shake"
        [udxMotionState]="refusals()"
        label="PIN"
        [value]="code()"
        (valueChange)="code.set($event)"
        [errorText]="invalid() ? 'Wrong PIN' : null"
      />
      <udx-button type="submit" size="small" label="Check" />
    </form>
  `,
})
export class MotionEmphasisShakeAngular {
  protected readonly code = signal('');
  protected readonly invalid = signal(false);
  // Each refusal is a new value of the state, and the field shakes.
  protected readonly refusals = signal(0);

  protected submit(event: Event): void {
    event.preventDefault();
    const refused = this.code() !== '1234';
    this.invalid.set(refused);
    if (refused) this.refusals.update((count) => count + 1);
  }
}
