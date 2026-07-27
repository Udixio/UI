// @vitest-environment jsdom

import { createContextMenuController, createMenuController } from './menu.js';

const createMenu = () => {
  const root = document.createElement('div');
  root.setAttribute('role', 'menu');
  root.innerHTML = `
    <button role="menuitem">Alpha</button>
    <button role="menuitem" disabled>Blocked</button>
    <button role="menuitem">Beta</button>
  `;
  document.body.append(root);
  return root;
};

describe('createMenuController', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('moves focus through enabled items and wraps', () => {
    const root = createMenu();
    const controller = createMenuController(root);
    const items = root.querySelectorAll<HTMLElement>('[role="menuitem"]');

    items[0].focus();
    items[0].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
    );
    expect(document.activeElement).toBe(items[2]);

    items[2].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
    );
    expect(document.activeElement).toBe(items[0]);
    controller.destroy();
  });

  it('supports Home, End, and type-ahead', () => {
    const root = createMenu();
    const controller = createMenuController(root);

    root.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'End', bubbles: true }),
    );
    expect(document.activeElement?.textContent).toBe('Beta');

    root.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'a', bubbles: true }),
    );
    expect(document.activeElement?.textContent).toBe('Alpha');
    controller.destroy();
  });
});

describe('createContextMenuController', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('dismisses on Escape and restores trigger focus', async () => {
    const root = document.createElement('div');
    const trigger = document.createElement('button');
    const menu = createMenu();
    root.append(trigger, menu);
    document.body.append(root);
    const onDismiss = vi.fn();
    const controller = createContextMenuController({
      root,
      trigger,
      menu,
      onDismiss,
    });

    await Promise.resolve();
    expect(document.activeElement?.textContent).toBe('Alpha');
    menu.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    await Promise.resolve();
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(trigger);
    controller.destroy();
  });

  it('dismisses outside and removes listeners on destroy', () => {
    const root = document.createElement('div');
    const trigger = document.createElement('button');
    const menu = createMenu();
    root.append(trigger, menu);
    document.body.append(root);
    const outside = document.createElement('button');
    document.body.append(outside);
    const onDismiss = vi.fn();
    const controller = createContextMenuController({
      root,
      trigger,
      menu,
      onDismiss,
    });

    outside.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(onDismiss).toHaveBeenCalledOnce();
    controller.destroy();
    outside.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
