import { useState } from 'react';
import { defineGesture } from '@udixio/motion/gesture';
import { Motion } from '@udixio/ui-react';
import '@udixio/motion/presets';

// A swipe flies the task out and hides it from assistive technology. Keep afterFlyOut at its default, hide: the state
// removes the task, and React takes it out of the page.
defineGesture('dismiss', { kind: 'swipe' });

const TASKS = ['Reply to the design review', 'Ship the release notes', 'Book the room for Friday'];

/** The task that takes the focus when the swiped one leaves: the next one, else the previous one. */
function neighbourOf(task: Element): HTMLElement | null {
  return (task.nextElementSibling ?? task.previousElementSibling) as HTMLElement | null;
}

export function TaskList() {
  const [tasks, setTasks] = useState(TASKS);

  return (
    <ul className="flex w-full max-w-88 flex-col gap-2">
      {tasks.map((task) => (
        // reflow closes the gap that a removed task leaves; the swipe completes the task, and onMotionSwipe removes it.
        <Motion
          key={task}
          as="li"
          name="reflow"
          gesture="dismiss"
          onMotionSwipe={(event) => {
            // A focused task that is removed loses the focus: give it to a task that stays.
            neighbourOf(event.target as Element)?.focus();
            setTasks((list) => list.filter((item) => item !== task));
          }}
          className="cursor-grab rounded-2xl bg-surface-container-highest py-2.5 pl-4 pr-4 text-body-large text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
        >
          {task}
        </Motion>
      ))}
    </ul>
  );
}
