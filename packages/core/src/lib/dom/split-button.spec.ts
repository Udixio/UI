// @vitest-environment jsdom

import { createSplitButtonController } from './split-button.js';

const createFixture = (onDismiss = vi.fn(), direction?: 'ltr' | 'rtl') => {
  const root = document.createElement('div');
  if (direction) {
    root.dir = direction;
    root.style.direction = direction;
  }
  const primaryButton = document.createElement('button');
  const menuButton = document.createElement('button');
  const menuIcon = document.createElement('span');
  const menu = document.createElement('div');
  menu.setAttribute('role', 'menu');
  menu.innerHTML = '<button role="menuitem">Save a copy</button>';
  root.append(primaryButton, menuButton, menu);
  document.body.append(root);
  const controller = createSplitButtonController({
    root,
    primaryButton,
    menuButton,
    menuIcon,
    onDismiss,
    reducedMotion: () => true,
  });
  return {
    controller,
    root,
    primaryButton,
    menuButton,
    menuIcon,
    menu,
    onDismiss,
  };
};

describe('createSplitButtonController', () => {
  afterEach(() => document.body.replaceChildren());

  it('selects only the menu button shape while the menu is open', () => {
    const { controller, primaryButton, menuButton, menuIcon } = createFixture();
    controller.setOpen(true);
    expect(primaryButton.style.borderTopRightRadius).toBe('4px');
    expect(menuButton.style.borderTopLeftRadius).toBe('20px');
    expect(menuIcon.style.rotate).toBe('180deg');

    controller.setOpen(false);
    expect(primaryButton.style.borderTopRightRadius).toBe('4px');
    expect(menuButton.style.borderTopLeftRadius).toBe('4px');
    expect(menuIcon.style.rotate).toBe('0deg');
    controller.destroy();
  });

  it('morphs only the interacted button in right-to-left direction', () => {
    const { controller, primaryButton, menuButton } = createFixture(
      vi.fn(),
      'rtl',
    );
    primaryButton.dispatchEvent(new Event('pointerenter'));
    expect(primaryButton.style.borderTopLeftRadius).toBe('20px');
    expect(primaryButton.style.borderBottomLeftRadius).toBe('20px');
    expect(menuButton.style.borderTopRightRadius).toBe('4px');
    expect(menuButton.style.borderBottomRightRadius).toBe('4px');

    primaryButton.dispatchEvent(new Event('pointerleave'));
    menuButton.dispatchEvent(new Event('pointerenter'));

    expect(primaryButton.style.borderTopLeftRadius).toBe('4px');
    expect(primaryButton.style.borderBottomLeftRadius).toBe('4px');
    expect(menuButton.style.borderTopRightRadius).toBe('20px');
    expect(menuButton.style.borderBottomRightRadius).toBe('20px');

    menuButton.dispatchEvent(new Event('pointerleave'));
    expect(menuButton.style.borderTopRightRadius).toBe('4px');
    expect(menuButton.style.borderBottomRightRadius).toBe('4px');

    controller.destroy();
  });

  it('dismisses on outside pointer input and removes the listener on destroy', () => {
    const outside = document.createElement('button');
    document.body.append(outside);
    const { controller, onDismiss } = createFixture();
    controller.setOpen(true);
    outside.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(onDismiss).toHaveBeenCalledWith('outside');

    controller.destroy();
    outside.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('dismisses on Escape from the menu and restores focus when closed', async () => {
    const { controller, menuButton, menu, onDismiss } = createFixture();
    controller.setOpen(true);
    menu.querySelector('button')?.focus();
    menu.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    expect(onDismiss).toHaveBeenCalledWith('escape');
    controller.setOpen(false, true);
    await Promise.resolve();
    expect(document.activeElement).toBe(menuButton);
    controller.destroy();
  });
});
