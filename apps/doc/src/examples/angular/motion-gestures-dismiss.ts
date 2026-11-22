import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { defineGesture } from '@udixio/motion/gesture';
import { Motion, MotionGesture } from '@udixio/ui-angular';
import '@udixio/motion/presets';

// A swipe flies the task out, hidden from assistive
// technology. Keep afterFlyOut at its default, hide: the
// list removes the task, and Angular takes it out of the
// page. A focused task hands the focus to the next task
// as it flies out, by itself.
defineGesture('dismiss', { type: 'swipe' });

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [Motion, MotionGesture],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="flex w-full max-w-88 flex-col gap-2">
      @for (task of tasks(); track task) {
        <!-- reflow closes the gap that a removed task leaves; the swipe completes the task, and (udxSwipe) removes it. -->
        <li
          udxMotion="reflow"
          udxMotionGesture="dismiss"
          (udxSwipe)="dismiss(task)"
          class="cursor-grab rounded-2xl bg-surface-container-highest py-2.5 pl-4 pr-4 text-body-large text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
        >
          {{ task }}
        </li>
      }
    </ul>
  `,
})
export class TaskList {
  protected readonly tasks = signal([
    'Reply to the design review',
    'Ship the release notes',
    'Book the room for Friday',
  ]);

  protected dismiss(task: string): void {
    this.tasks.update((list) => list.filter((item) => item !== task));
  }
}
