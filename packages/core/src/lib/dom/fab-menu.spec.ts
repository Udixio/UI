// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createFabMenuController } from './fab-menu.js';

function getElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing test element: ${selector}`);
  return element;
}

describe('fab menu DOM controller', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
  });

  it('does not move focus when the menu opens from code', async () => {
    document.body.innerHTML = `
      <button id="elsewhere">Elsewhere</button>
      <div id="root" data-open="true">
        <button id="trigger">Create</button>
        <div id="panel">
          <span data-fab-menu-action><button id="action">Document</button></span>
        </div>
      </div>
    `;
    const root = getElement<HTMLElement>('#root');
    const elsewhere = getElement<HTMLElement>('#elsewhere');
    elsewhere.focus();
    // Opened at connect (a restored state), then closed and opened again from code (an autoplay).
    const controller = createFabMenuController({
      root,
      trigger: getElement<HTMLElement>('#trigger'),
      panel: getElement<HTMLElement>('#panel'),
      onDismiss: () => undefined,
    });
    await Promise.resolve();
    expect(document.activeElement).toBe(elsewhere);

    controller.setOpen(false);
    controller.setOpen(true);
    await Promise.resolve();
    expect(document.activeElement).toBe(elsewhere);
    controller.destroy();
  });

  it('focuses the first enabled action, without scrolling, when the trigger opens the menu', async () => {
    document.body.innerHTML = `
      <div id="root" data-open="false">
        <button id="trigger">Create</button>
        <div id="panel" hidden inert>
          <button disabled>Disabled</button>
          <span data-fab-menu-action><button id="action">Document</button></span>
        </div>
      </div>
    `;
    const root = getElement<HTMLElement>('#root');
    const trigger = getElement<HTMLElement>('#trigger');
    const action = getElement<HTMLElement>('#action');
    const focus = vi.spyOn(action, 'focus');
    // The adapter opens the menu from the trigger's click, a pointer or a keyboard activation.
    trigger.addEventListener('click', () => {
      root.dataset['open'] = 'true';
    });
    const controller = createFabMenuController({
      root,
      trigger,
      panel: getElement<HTMLElement>('#panel'),
      onDismiss: () => undefined,
    });

    trigger.click();
    await Promise.resolve();
    await Promise.resolve();
    expect(document.activeElement).toBe(action);
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    controller.destroy();
  });

  it('restores focus to the trigger after an accepted Escape dismissal', async () => {
    document.body.innerHTML = `
      <div id="root" data-open="true">
        <button id="trigger">Create</button>
        <div id="panel">
          <span data-fab-menu-action><button id="action">Document</button></span>
        </div>
      </div>
    `;
    const root = getElement<HTMLElement>('#root');
    const trigger = getElement<HTMLElement>('#trigger');
    const panel = getElement<HTMLElement>('#panel');
    const onDismiss = vi.fn();
    const controller = createFabMenuController({
      root,
      trigger,
      panel,
      onDismiss,
    });

    getElement<HTMLElement>('#action').focus();
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    expect(onDismiss).toHaveBeenCalledWith('escape');
    await Promise.resolve();
    expect(document.activeElement).not.toBe(trigger);

    root.dataset['open'] = 'false';
    await Promise.resolve();
    await Promise.resolve();
    expect(document.activeElement).toBe(trigger);
    controller.destroy();
  });

  it('dismisses outside presses and removes listeners on destroy', () => {
    document.body.innerHTML = `
      <div id="root" data-open="true">
        <button id="trigger">Create</button>
        <div id="panel">
          <span data-fab-menu-action><button>Document</button></span>
        </div>
      </div>
      <button id="outside">Outside</button>
    `;
    const root = getElement<HTMLElement>('#root');
    const onDismiss = vi.fn();
    const controller = createFabMenuController({
      root,
      trigger: getElement<HTMLElement>('#trigger'),
      panel: getElement<HTMLElement>('#panel'),
      onDismiss,
    });

    getElement('#outside').dispatchEvent(
      new Event('pointerdown', { bubbles: true }),
    );
    expect(onDismiss).toHaveBeenCalledWith('outside');

    controller.destroy();
    onDismiss.mockClear();
    getElement('#outside').dispatchEvent(
      new Event('pointerdown', { bubbles: true }),
    );
    expect(onDismiss).not.toHaveBeenCalled();
  });
});
