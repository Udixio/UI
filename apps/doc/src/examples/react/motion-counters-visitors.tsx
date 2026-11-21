import { useState } from 'react';
import { defineValue } from '@udixio/motion/value';
import { Button, useMotionValue } from '@udixio/ui-react';

// A counter: a state value with a format. Its number is the value attribute of its element, and its text follows it.
defineValue('visitors', {
  source: 'state',
  format: 'integer',
  range: [0, 100000],
});

export function MotionCountersVisitorsReact() {
  const [visitors, setVisitors] = useState(12480);
  // The ref counts the element to each new number that the state sets as its value.
  const counter = useMotionValue('visitors');

  return (
    <div className="flex flex-col items-start gap-4">
      <data ref={counter.ref} value={visitors} className="block text-display-small text-on-surface">
        12,480
      </data>
      <Button size="small" label="Add 1,000 visitors" onClick={() => setVisitors((value) => value + 1000)} />
    </div>
  );
}
