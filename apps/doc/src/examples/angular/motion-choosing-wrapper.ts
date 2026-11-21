import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Button, Motion } from '@udixio/ui-angular';
import '@udixio/motion/presets';

// The host of a Udixio component is display: contents: it has no box to move, so the motion goes on a wrapper.
@Component({
  selector: 'app-save-and-share',
  standalone: true,
  imports: [Button, Motion],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap items-center gap-4">
      <!-- Each new value of the count replays the press. -->
      <span udxMotion="press" [udxMotionState]="saves()" class="inline-flex">
        <udx-button size="small" label="Save" (click)="saves.update((value) => value + 1)" />
      </span>
      <!-- A template reference to the directive gives play(), to replay from a handler. -->
      <span udxMotion="press" #share="udxMotion" class="inline-flex">
        <udx-button size="small" variant="tonal" label="Share" (click)="share.play()" />
      </span>
    </div>
  `,
})
export class SaveAndShare {
  protected readonly saves = signal(0);
}
