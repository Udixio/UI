// @vitest-environment jsdom

import { createFabMenuController } from './fab-menu.js';

describe('fab menu DOM controller', () => {
  it('focuses the first enabled action and dismisses on Escape', async () => {
    document.body.innerHTML = `
      <div id="root">
        <button id="trigger">Create</button>
        <div id="panel">
          <button disabled>Disabled</button>
          <button id="action">Document</button>
        </div>
      </div>
    `;
    const root = document.querySelector<HTMLElement>('#root')!;
    const trigger = document.querySelector<HTMLElement>('#trigger')!;
    const panel = document.querySelector<HTMLElement>('#panel')!;
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
    expect(document.activeElement).toBe(trigger);
    controller.destroy();
  });

  it('dismisses outside presses and removes listeners on destroy', () => {
    document.body.innerHTML = `
      <div id="root">
        <button id="trigger">Create</button>
        <div id="panel"><button>Document</button></div>
      </div>
      <button id="outside">Outside</button>
    `;
    const root = document.querySelector<HTMLElement>('#root')!;
    const onDismiss = vi.fn();
    const controller = createFabMenuController({
      root,
      trigger: document.querySelector<HTMLElement>('#trigger')!,
      panel: document.querySelector<HTMLElement>('#panel')!,
      onDismiss,
    });

    document
      .querySelector('#outside')!
      .dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(onDismiss).toHaveBeenCalledWith('outside');

    controller.destroy();
    onDismiss.mockClear();
    document
      .querySelector('#outside')!
      .dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(onDismiss).not.toHaveBeenCalled();
  });
});
