// @vitest-environment jsdom

import { animate } from 'motion';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  FAB_MOTION_DURATION_SECONDS,
  FAB_MOTION_EASING,
} from '../fab-motion.js';
import { createFabMenuController } from './fab-menu.js';

vi.mock('motion', () => ({ animate: vi.fn() }));

function animationControls() {
  return {
    stop: vi.fn(),
    then: (callback: () => void) => {
      callback();
      return Promise.resolve();
    },
  };
}

function getElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing test element: ${selector}`);
  return element;
}

describe('fab menu DOM controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(animate).mockImplementation(() => animationControls() as never);
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

  it('animates actions from the trigger outward and hides them after close', async () => {
    document.body.innerHTML = `
      <div id="root" data-open="false">
        <button id="trigger">Create</button>
        <div id="panel">
          <span id="first" data-fab-menu-action><button>First</button></span>
          <span id="last" data-fab-menu-action><button>Last</button></span>
        </div>
      </div>
    `;
    const root = getElement<HTMLElement>('#root');
    const panel = getElement<HTMLElement>('#panel');
    const controller = createFabMenuController({
      root,
      trigger: getElement<HTMLElement>('#trigger'),
      panel,
      onDismiss: vi.fn(),
      reducedMotion: () => false,
    });

    expect(panel.hidden).toBe(true);
    root.dataset['open'] = 'true';
    await Promise.resolve();

    expect(panel.hidden).toBe(false);
    expect(panel.inert).toBe(false);
    expect(animate).toHaveBeenNthCalledWith(
      1,
      document.querySelector('#first'),
      expect.objectContaining({
        clipPath: ['inset(0 0 0 100%)', 'inset(0 0 0 0%)'],
      }),
      expect.objectContaining({ delay: 0.06 }),
    );
    expect(animate).toHaveBeenNthCalledWith(
      2,
      document.querySelector('#first'),
      expect.objectContaining({ opacity: [0, 1] }),
      expect.objectContaining({ delay: 0.21 }),
    );
    expect(animate).toHaveBeenNthCalledWith(
      3,
      document.querySelector('#last'),
      expect.objectContaining({
        clipPath: ['inset(0 0 0 100%)', 'inset(0 0 0 0%)'],
      }),
      expect.objectContaining({ delay: 0 }),
    );
    expect(animate).toHaveBeenNthCalledWith(
      4,
      document.querySelector('#last'),
      expect.objectContaining({ opacity: [0, 1] }),
      expect.objectContaining({ delay: 0.15 }),
    );

    root.dataset['open'] = 'false';
    await Promise.resolve();
    expect(panel.inert).toBe(true);
    expect(panel.style.opacity).toBe('1');
    expect(animate).toHaveBeenNthCalledWith(
      5,
      document.querySelector('#first'),
      expect.objectContaining({
        clipPath: ['inset(0 0 0 0%)', 'inset(0 0 0 100%)'],
      }),
      expect.objectContaining({ delay: 0.06 }),
    );
    await vi.waitFor(() => expect(panel.hidden).toBe(true));
    expect(panel.style.opacity).toBe('0');
    controller.destroy();
  });

  it('animates between stable target geometries while the visible Fab is changing', () => {
    document.body.innerHTML = `
      <div id="root" data-open="false">
        <button id="trigger">Create</button>
        <button id="closed-target">Create</button>
        <button id="open-target">Close Create</button>
        <div id="panel">
          <span data-fab-menu-action><button>Document</button></span>
        </div>
      </div>
    `;
    const root = getElement<HTMLElement>('#root');
    const trigger = getElement<HTMLElement>('#trigger');
    const closedTrigger = getElement<HTMLElement>('#closed-target');
    const openTrigger = getElement<HTMLElement>('#open-target');
    const panel = getElement<HTMLElement>('#panel');
    const height = 56;
    const computedStyle = vi
      .spyOn(window, 'getComputedStyle')
      .mockReturnValue({ borderTopLeftRadius: '16px' } as CSSStyleDeclaration);
    vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue({
      width: 118,
      height: 68,
    } as DOMRect);
    vi.spyOn(closedTrigger, 'getBoundingClientRect').mockReturnValue({
      width: 160,
      height,
    } as DOMRect);
    vi.spyOn(openTrigger, 'getBoundingClientRect').mockReturnValue({
      width: 56,
      height,
    } as DOMRect);
    const controller = createFabMenuController({
      root,
      trigger,
      closedTrigger,
      openTrigger,
      panel,
      onDismiss: vi.fn(),
      reducedMotion: () => false,
    });

    controller.setOpen(true);

    expect(animate).toHaveBeenCalledWith(
      trigger,
      {
        width: ['160px', '56px'],
        height: ['56px', '56px'],
        borderRadius: ['16px', '28px'],
      },
      {
        duration: FAB_MOTION_DURATION_SECONDS,
        ease: FAB_MOTION_EASING,
      },
    );
    controller.destroy();
    computedStyle.mockRestore();
  });

  it('preserves visibility changes without animation for reduced motion', () => {
    document.body.innerHTML = `
      <div id="root" data-open="true">
        <button id="trigger">Create</button>
        <div id="panel">
          <span data-fab-menu-action><button>Document</button></span>
        </div>
      </div>
    `;
    const panel = getElement<HTMLElement>('#panel');
    const controller = createFabMenuController({
      root: getElement<HTMLElement>('#root'),
      trigger: getElement<HTMLElement>('#trigger'),
      panel,
      onDismiss: vi.fn(),
      reducedMotion: () => true,
    });

    expect(panel.hidden).toBe(false);
    expect(panel.inert).toBe(false);
    expect(animate).not.toHaveBeenCalled();
    controller.destroy();
  });
});
