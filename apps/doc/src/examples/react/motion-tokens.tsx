import { defineMotion } from '@udixio/motion';
import { useMotion } from '@udixio/ui-react';

// A motion names its timing by token: a spring, or a curve of a duration and an easing.
defineMotion('panel-in', {
  verb: 'appear',
  keyframes: [
    { opacity: 0, y: 24 },
    { opacity: 1, y: 0 },
  ],
  timing: 'spring.fast.spatial',
});

export function MotionTokensReact({ open }: { open: boolean }) {
  const panel = useMotion('panel-in', {
    present: open,
  });
  if (!panel.mounted) return null;
  return <div ref={panel.ref}>Moves</div>;
}
