import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Button, Motion } from '@udixio/ui-angular';
import '@udixio/motion/presets';

@Component({
  selector: 'docs-motion-emphasis-angular',
  standalone: true,
  imports: [Button, Motion],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-start gap-4">
      <!-- The like button presses on each click: each new value of the state replays the press. -->
      <udx-button
        udxMotion="press"
        [udxMotionState]="likes()"
        size="small"
        label="Like"
        (click)="likes.update((count) => count + 1)"
      />
      <p class="text-body-medium text-on-surface-variant">Likes: {{ likes() }}</p>
    </div>
  `,
})
export class MotionEmphasisAngular {
  protected readonly likes = signal(0);
}
