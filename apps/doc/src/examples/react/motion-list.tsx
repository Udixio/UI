import { useState } from 'react';
import { defineMotion } from '@udixio/motion';
import { Motion, Presence } from '@udixio/ui-react';
import '@udixio/motion/presets';

// Messages that enter in the same render start one step apart, from the first.
// A leaving message is taken out of the flow, so its neighbours close the gap.
defineMotion('inbox', {
  verb: 'appear',
  keyframes: [
    { opacity: 0, y: -16, scale: 0.96 },
    { opacity: 1, y: 0, scale: 1 },
  ],
  stagger: 'normal',
  origin: 'first',
  exit: 'out-of-flow',
});

type Message = { id: number; text: string };

const TEXTS = ['Mo: deploy finished', 'Ines: new comment', 'Kai: release is ready'];
let lastId = 2;

export function MotionListReact() {
  const [items, setItems] = useState<Message[]>([
    { id: 1, text: 'Ada: your build passed' },
    { id: 2, text: 'Lin: review requested' },
  ]);

  const addThree = () => {
    const three = [0, 1, 2].map((n) => ({ id: ++lastId, text: TEXTS[n] }));
    // Added in one render: the three cascade in.
    setItems((list) => [...three, ...list]);
  };
  // The message is taken out of the list; the Presence keeps it rendered until its exit has played.
  const dismiss = (id: number) => setItems((list) => list.filter((item) => item.id !== id));

  return (
    <div className="flex flex-col items-start gap-4">
      <button
        type="button"
        onClick={addThree}
        className="rounded-full bg-primary px-6 py-2.5 text-label-large text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
      >
        Add three
      </button>
      {/* `out-of-flow` takes a leaving message out of the flow: the list must be positioned. */}
      <ul className="relative flex w-80 max-w-full flex-col gap-2">
        <Presence>
          {items.map((item) => (
            // A presence and a layout: the message enters and leaves, and follows its neighbours.
            <Motion key={item.id} as="li" name="inbox reflow">
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-surface-container-high py-2 pl-4 pr-2">
                <span className="text-body-large text-on-surface">{item.text}</span>
                <button
                  type="button"
                  onClick={() => dismiss(item.id)}
                  className="rounded-full px-3 py-2 text-label-large text-primary hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
                >
                  Dismiss
                </button>
              </div>
            </Motion>
          ))}
        </Presence>
      </ul>
    </div>
  );
}
