import { useState } from 'react';
import { defineMotion } from '@udixio/motion';
import { useMotion } from '@udixio/ui-react';
defineMotion('pop', {
  verb: 'appear',
  keyframes: [{ opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1 }],
});
export function Saved() {
  const [open, setOpen] = useState(true);
  const note = useMotion('pop', { present: open });
  return <>
    <button onClick={() => setOpen(!open)}>Toggle</button>
    {note.mounted && <p ref={note.ref}>Saved to your library</p>}
  </>;
}
