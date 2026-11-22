// TRIAL (review 5, Q3): a Udixio component animated with no wrapper. Delete or keep with the decision.
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { Button, Card, Motion, TextField } from '@udixio/ui-angular';
import '@udixio/motion/presets';

@Component({
  selector: 'docs-motion-trial-components-angular',
  standalone: true,
  imports: [Button, Card, Motion, TextField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid gap-8" data-trial="angular">
      <!-- udxMotion on the host: it has no box, so the press moves the Button's own <button>. -->
      <div class="flex flex-wrap items-center gap-4" data-trial-part="press">
        <udx-button
          udxMotion="press"
          [udxMotionState]="saves()"
          size="small"
          [label]="saves() === 0 ? 'Save' : 'Saved ' + saves() + '×'"
          (click)="saves.update((value) => value + 1)"
        />
      </div>
      <!-- The entry plays on the Card's root, each time it is created. -->
      <div class="flex flex-col items-start gap-4" data-trial-part="appear">
        <udx-button size="small" variant="tonal" label="Show the card again" (click)="entries.update((value) => value + 1)" />
        @for (entry of [entries()]; track entry) {
          <udx-card udxMotion="slide" variant="elevated" class="w-full max-w-xs p-4">
            <p class="text-title-medium text-on-surface">Weekly report</p>
            <p class="mt-1 text-body-medium text-on-surface-variant">Ready to share.</p>
          </udx-card>
        }
      </div>
      <!-- The shake moves the field's root, not its input. -->
      <form (submit)="check($event)" class="flex flex-col items-start gap-4" data-trial-part="shake">
        <udx-text-field
          udxMotion="shake"
          [udxMotionState]="refusals()"
          label="Code"
          [value]="code()"
          (valueChange)="code.set($event)"
          [errorText]="invalid() ? 'Not this code' : null"
        />
        <udx-button type="submit" size="small" variant="outlined" label="Check" />
      </form>
    </div>
  `,
})
export class MotionTrialComponentsAngular {
  protected readonly saves = signal(0);
  protected readonly entries = signal(0);
  protected readonly code = signal('');
  // Each new value of a count replays its emphasis.
  protected readonly refusals = signal(0);
  protected readonly invalid = computed(() => this.refusals() > 0 && this.code() !== '1234');

  protected check(event: Event): void {
    event.preventDefault();
    if (this.code() !== '1234') this.refusals.update((value) => value + 1);
  }
}
