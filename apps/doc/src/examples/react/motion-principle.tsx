import { useState } from 'react';
import { defineMotion } from '@udixio/motion';
import { Motion } from '@udixio/ui-react';

defineMotion('pop', {
  verb: 'appear',
  keyframes: [{ opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1 }],
});

export function Saved() {
  const [open, setOpen] = useState(true);
  return <>
    <button onClick={() => setOpen(!open)}>Toggle</button>
    <Motion as="p" name="pop" present={open}>Saved to your library</Motion>
  </>;
}
