// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';
import { createSearchOutsideDismissController } from './search.js';

describe('search outside dismissal controller', () => {
  it('dismisses outside pointer presses and removes its listener on destroy', () => {
    const root = document.createElement('div');
    const inside = document.createElement('button');
    const outside = document.createElement('button');
    root.append(inside);
    document.body.append(root, outside);
    const onDismiss = vi.fn();
    const controller = createSearchOutsideDismissController({
      root,
      onDismiss,
    });

    outside.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    inside.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(onDismiss).toHaveBeenCalledOnce();

    controller.destroy();
    outside.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(onDismiss).toHaveBeenCalledOnce();

    root.remove();
    outside.remove();
  });
});
