import { useState } from 'react';
import { defineValue } from '@udixio/motion/value';
import { Button, useMotionValue } from '@udixio/ui-react';

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
      <Button size="small" label="Add 1,000 visitors" onClick={() => setVisitors((value) => value + 1000)} />
    </div>
  );
}
