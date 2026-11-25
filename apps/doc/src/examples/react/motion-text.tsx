import { useState } from 'react';
import { defineMotion } from '@udixio/motion';
import { Button, Motion } from '@udixio/ui-react';

// Each word rises and fades in, in turn. A line plays again when it becomes the current one.
defineMotion('headline', {
  verb: 'reveal',
  split: 'words',
  reduced: 'fade',
  keyframes: [
    { opacity: 0, y: 12 },
    { opacity: 1, y: 0 },
  ],
});

const LINES = [
  'Every word arrives in turn, and is read once.',
  'The light comes in slowly, one word at a time.',
  'Let the last word settle.',
];

export function MotionTextReact() {
  const [line, setLine] = useState(0);

  return (
    <div className="flex flex-col items-start gap-4">
      {/* One paragraph per line: the others stay hidden, and their words are not rewritten. */}
      {LINES.map((text, index) => (
        <Motion
          key={text}
          as="p"
          name="headline"
          state={line === index}
          className={
            index === line ? 'text-headline-medium text-on-surface' : 'hidden'
          }
        >
          {text}
        </Motion>
      ))}
      <Button
        size="small"
        label="Next line"
        onClick={() => setLine((line + 1) % LINES.length)}
      />
    </div>
  );
}
