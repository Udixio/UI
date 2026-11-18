import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Motion } from '@udixio/ui-angular';
import '@udixio/motion/presets';

@Component({
  selector: 'docs-motion-presets-angular',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Motion],
  template: `
    <div class="flex flex-col items-start gap-4">
      @if (open()) {
        <div udxMotion="fade">Fades in and out</div>
      }
      <button type="button" (click)="open.set(!open())">{{ open() ? 'Hide' : 'Show' }}</button>
      <button type="button" udxMotion="press" [udxMotionState]="saves()" (click)="saves.update((value) => value + 1)">
        Save
      </button>
    </div>
  `,
})
export class MotionPresetsAngular {
  // The card is in the template while `open` is true; Angular keeps it until its exit has played.
  protected readonly open = signal(true);
  // Each new value of the count replays the press.
  protected readonly saves = signal(0);
}
