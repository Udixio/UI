import { useState } from 'react';
import { defineGesture } from '@udixio/motion/gesture';
import { Motion } from '@udixio/ui-react';
import '@udixio/motion/presets';

// A swipe flies the task out, hidden from assistive
// technology. Keep afterFlyOut at its default, hide: the
// state removes the task, and React takes it out of the
// page. A focused task hands the focus to the next task
// as it flies out, by itself.
defineGesture('dismiss', { type: 'swipe' });

const TASKS = ['Reply to the design review', 'Ship the release notes', 'Book the room for Friday'];

export function TaskList() {
  const [tasks, setTasks] = useState(TASKS);
  const complete = (task: string) =>
    setTasks((list) => list.filter((item) => item !== task));

  return (
    <ul className="flex w-full max-w-88 flex-col gap-2">
      {tasks.map((task) => (
        // reflow closes the gap that a removed task leaves; the swipe completes the task, and onMotionSwipe removes it.
        <Motion
          key={task}
          as="li"
          name="reflow"
          gesture="dismiss"
          onMotionSwipe={() => complete(task)}
          className="cursor-grab rounded-2xl bg-surface-container-highest py-2.5 pl-4 pr-4 text-body-large text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
        >
          {task}
        </Motion>
      ))}
    </ul>
  );
}
