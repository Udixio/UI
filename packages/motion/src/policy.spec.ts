import { expect, it, vi } from 'vitest';
import { motionPolicy, watchMotionPolicy } from './policy.js';

it('reads a policy that is not reduced on the server, and watches it safely', () => {
  expect(motionPolicy.reduced).toBe(false);
  const onChange = vi.fn();
  const stop = watchMotionPolicy(onChange);
  expect(onChange).toHaveBeenCalledOnce();
  expect(onChange).toHaveBeenCalledWith(false);
  stop();
  stop();
  expect(motionPolicy.reduced).toBe(false);
});
