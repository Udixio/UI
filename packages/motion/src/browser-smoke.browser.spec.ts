import { expect, it } from 'vitest';

it('supports Web Animations in a browser', () => {
  const el = document.createElement('div');
  document.body.append(el);
  el.animate([{ opacity: 0 }, { opacity: 1 }], 200);

  expect(el.getAnimations()).toHaveLength(1);
  el.remove();
});
