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

  it('focuses the first enabled action and restores focus after an accepted Escape dismissal', async () => {
    document.body.innerHTML = `
      <div id="root" data-open="true">
        <button id="trigger">Create</button>
        <div id="panel">
          <button disabled>Disabled</button>
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

    await Promise.resolve();
    expect(document.activeElement?.id).toBe('action');
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
