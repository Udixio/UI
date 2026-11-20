import { useState } from 'react';
import { defineMotion } from '@udixio/motion';
import { Button, Motion, Presence } from '@udixio/ui-react';
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
    // Added in one render: the three cascade in, and past five the oldest leave.
    setItems((list) => [...three, ...list].slice(0, 5));
  };
  // The message is taken out of the list; the Presence keeps it rendered until its exit has played.
  const dismiss = (id: number) => setItems((list) => list.filter((item) => item.id !== id));

  return (
    <div className="flex w-full max-w-80 flex-col items-start gap-4">
      <Button size="small" label="Add three" onClick={addThree} />
      {/* `out-of-flow` takes a leaving message out of the flow: the list must be positioned. */}
      <ul className="relative flex w-full flex-col gap-2">
        <Presence>
          {items.map((item) => (
            // A presence and a layout: the message enters and leaves, and follows its neighbours.
            <Motion key={item.id} as="li" name="inbox reflow">
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-surface-container-high py-2 pl-4 pr-2">
                <span className="min-w-0 text-body-large text-on-surface">{item.text}</span>
                <Button variant="text" size="small" label="Dismiss" onClick={() => dismiss(item.id)} />
              </div>
            </Motion>
          ))}
        </Presence>
      </ul>
    </div>
  );
}
