import type { Scenario } from '../scenario.js';

export const f2FadeSlide: Scenario = {
  name: 'fade-slide', family: 'F2',
  request: { keyframes: [{ opacity: 0, y: 24 }, { opacity: 1, y: 0 }], timing: { duration: 200, easing: 'cubic-bezier(0.34, 0.80, 0.34, 1.00)' } },
  samples: [0, 0.25, 0.5, 0.75, 1],
};
