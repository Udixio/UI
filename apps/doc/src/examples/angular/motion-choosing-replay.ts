import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Button, Motion } from '@udixio/ui-angular';
import '@udixio/motion/presets';

@Component({
  selector: 'app-replay-from-state',
  standalone: true,
  imports: [Button, Motion],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Each new state plays the first listed motion
         that is not a presence: the press, and the
         layout, once the host has the new width. -->
    <div class="flex w-full flex-col items-start gap-4">
      <span udxMotion="press" [udxMotionState]="wide()" class="inline-flex">
        <udx-button
          size="small"
          [label]="wide() ? 'Narrow' : 'Widen'"
          (click)="wide.set(!wide())"
        />
      </span>
      <div
        udxMotion="reflow"
        [udxMotionState]="wide()"
        [style.width]="wide() ? '100%' : '50%'"
        class="rounded-2xl bg-surface-container-high p-4"
      >
        Now playing
      </div>
    </div>
  `,
})
export class ReplayFromState {
  protected readonly wide = signal(false);
}
