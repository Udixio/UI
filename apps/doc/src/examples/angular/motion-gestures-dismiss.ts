import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { defineGesture } from '@udixio/motion/gesture';
import { Motion, MotionGesture } from '@udixio/ui-angular';
import '@udixio/motion/presets';

// A swipe flies the task out and hides it from assistive technology. Keep afterFlyOut at its default, hide: the list
// removes the task, and Angular takes it out of the page.
defineGesture('dismiss', { kind: 'swipe' });

/** The task that takes the focus when the swiped one leaves: the next one, else the previous one. */
function neighbourOf(task: Element): HTMLElement | null {
  return (task.nextElementSibling ?? task.previousElementSibling) as HTMLElement | null;
}

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
          (udxSwipe)="dismiss($event, task)"
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

  protected dismiss(event: CustomEvent, task: string): void {
    // A focused task that is removed loses the focus: give it to a task that stays.
    neighbourOf(event.target as Element)?.focus();
    this.tasks.update((list) => list.filter((item) => item !== task));
  }
}
