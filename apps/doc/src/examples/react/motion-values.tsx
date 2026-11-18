import { useState } from 'react';
import { defineValue } from '@udixio/motion/value';
import { useMotionValue } from '@udixio/ui-react';

// A counter: a state value with a format, written as its number and as the text of its element.
defineValue('visitors-count', {
  source: 'state',
  format: 'integer',
  range: [0, 100000],
});

export function MotionValuesReact() {
  const [visitors, setVisitors] = useState(12480);
  // The counter reads its number from its value attribute, and counts to each new one.
  const counter = useMotionValue('visitors-count');

  return (
    <div className="flex flex-col items-start gap-4">
      <data
        ref={counter.ref}
        value={visitors}
        className="block text-display-small text-on-surface"
      >
        12480
      </data>
      <button
        type="button"
        onClick={() => setVisitors((value) => value + 1000)}
        className="rounded-full bg-primary px-6 py-2.5 text-label-large text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
      >
        Add 1,000 visitors
      </button>
    </div>
  );
}
