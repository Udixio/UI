import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Button, Motion } from '@udixio/ui-angular';
import '@udixio/motion/presets';

@Component({
  selector: 'docs-motion-presets-angular',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Motion],
  template: `
    <div class="flex flex-col items-start gap-4">
      @if (open()) {
        <div udxMotion="fade">Fades in and out</div>
      }
      <udx-button size="small" [label]="open() ? 'Hide' : 'Show'" (click)="open.set(!open())" />
      <!-- The motion sits on a plain wrapper, around the button it moves. -->
      <span udxMotion="press" [udxMotionState]="saves()" class="inline-flex">
        <udx-button size="small" variant="tonal" label="Save" (click)="saves.update((value) => value + 1)" />
      </span>
    </div>
  `,
})
export class MotionPresetsAngular {
  // The card is in the template while `open` is true; Angular keeps it until its exit has played.
  protected readonly open = signal(true);
  // Each new value of the count replays the press.
  protected readonly saves = signal(0);
}
