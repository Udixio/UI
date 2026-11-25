import { useState } from 'react';
import { Motion } from '@udixio/ui-react';
import '@udixio/motion/presets';

export function Card() {
  const [wide, setWide] = useState(false);

  // A layout motion does not observe the inline style. The state is the value that changes with it: each new state
  // plays the move, once the new width is applied.
  return (
    <Motion
      name="reflow"
      state={wide}
      style={{ width: wide ? '100%' : '50%' }}
      className="h-16 rounded-2xl bg-primary"
      onClick={() => setWide(!wide)}
    />
  );
}
