import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Button, Motion } from '@udixio/ui-angular';
import '@udixio/motion/presets';

// udxMotion goes on the component's own tag. Its host has no box, so the press moves the Button's own <button>.
@Component({
  selector: 'app-save-and-share',
  standalone: true,
  imports: [Button, Motion],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- gap spaces the buttons: a structural utility such as space-x-4 would not reach them. -->
    <div class="flex flex-wrap items-center gap-4">
      <!-- Each new value of the count replays the press. -->
      <udx-button
        udxMotion="press"
        [udxMotionState]="saves()"
        size="small"
        label="Save"
        (click)="saves.update((value) => value + 1)"
      />
      <!-- A template reference to the directive gives play(), to replay from a handler. -->
      <udx-button
        udxMotion="press"
        #share="udxMotion"
        size="small"
        variant="tonal"
        label="Share"
        (click)="share.play()"
      />
    </div>
  `,
})
export class SaveAndShare {
  protected readonly saves = signal(0);
}
