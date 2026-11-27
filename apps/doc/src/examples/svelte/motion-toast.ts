import { defineMotion } from '@udixio/motion';

// The toast's motion, defined once by name: it rises
// 16 px and grows from 96 % as it fades in.
defineMotion('toast', {
  verb: 'appear',
  keyframes: [
    { opacity: 0, y: 16, scale: 0.96 },
    { opacity: 1, y: 0, scale: 1 },
  ],
});
