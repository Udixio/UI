import { useState } from 'react';
import { defineValue } from '@udixio/motion/value';
import {
  Button,
  useMotionValue,
} from '@udixio/ui-react';

// A counter: a state value with a format. Its
// number is the value attribute of its element,
// and its text follows it.
defineValue('plays', {
  source: 'state',
  format: 'integer',
  range: [0, 100000],
});

export function MotionCountersPlaysReact() {
  const [plays, setPlays] = useState(12480);
  // The ref counts the element to each new number
  // that the state sets as its value.
  const counter = useMotionValue('plays');

  return (
    <div className="flex flex-col items-start gap-4">
      <data
        ref={counter.ref}
        value={plays}
        className="block text-display-small
          text-on-surface"
      >
        12,480
      </data>
      <Button
        size="small"
        label="Add 1,000 plays"
        onClick={() => setPlays((n) => n + 1000)}
      />
    </div>
  );
}
