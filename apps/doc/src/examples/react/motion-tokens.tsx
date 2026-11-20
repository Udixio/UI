import { defineMotion } from '@udixio/motion';
import { Motion } from '@udixio/ui-react';

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
  return <Motion name="panel-in" present={open}>Moves</Motion>;
}
