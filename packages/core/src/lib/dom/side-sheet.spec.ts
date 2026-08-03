// @vitest-environment jsdom

import { animate } from 'motion';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createSideSheetController,
  createSideSheetTransitionController,
} from './side-sheet.js';

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

describe('side sheet DOM controller', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.body.style.overflow = '';
  });

  it('inerts every other body child, locks scroll, and focuses the panel', () => {
    document.body.innerHTML = `
      <button id="trigger">Open</button>
      <div id="overlay"></div>
      <div id="panel">
        <button id="close">Close</button>
      </div>
    `;
    const trigger = getElement<HTMLElement>('#trigger');
    trigger.focus();
    const overlay = getElement<HTMLElement>('#overlay');
    const panel = getElement<HTMLElement>('#panel');
    const onDismiss = vi.fn();

    const controller = createSideSheetController({ panel, overlay, onDismiss });

    expect(trigger.inert).toBe(true);
    expect(overlay.inert).toBeFalsy();
    expect(panel.inert).toBeFalsy();
    expect(document.body.style.overflow).toBe('hidden');
    expect(document.activeElement?.id).toBe('close');

    controller.destroy();

    expect(trigger.inert).toBe(false);
    expect(document.body.style.overflow).toBe('');
    expect(document.activeElement).toBe(trigger);
  });

  it('scopes inerting to an explicit custom container, not always document.body', () => {
    document.body.innerHTML = `
      <button id="outside-container">Outside custom container</button>
      <div id="container">
        <button id="sibling-in-container">Sibling in container</button>
        <div id="overlay"></div>
        <div id="panel"><button id="close">Close</button></div>
      </div>
    `;
    const outsideContainer = getElement<HTMLElement>('#outside-container');
    const siblingInContainer = getElement<HTMLElement>(
      '#sibling-in-container',
    );
    const container = getElement<HTMLElement>('#container');
    const overlay = getElement<HTMLElement>('#overlay');
    const panel = getElement<HTMLElement>('#panel');
    const controller = createSideSheetController({
      panel,
      overlay,
      container,
      onDismiss: vi.fn(),
    });

    // Only siblings inside the explicit container are made inert; content
    // outside it (a document.body-level sibling of the container) is untouched.
    expect(siblingInContainer.inert).toBe(true);
    expect(outsideContainer.inert).toBeFalsy();

    controller.destroy();
    expect(siblingInContainer.inert).toBe(false);
  });

  it('exempts a wrapper that contains panel/overlay as descendants, not just as direct children', () => {
    document.body.innerHTML = `
      <button id="sibling">Sibling</button>
      <div id="wrapper" style="display: contents">
        <div id="overlay"></div>
        <div id="panel"><button id="close">Close</button></div>
      </div>
    `;
    const sibling = getElement<HTMLElement>('#sibling');
    const overlay = getElement<HTMLElement>('#overlay');
    const panel = getElement<HTMLElement>('#panel');
    const controller = createSideSheetController({
      panel,
      overlay,
      onDismiss: vi.fn(),
    });

    // The wrapper itself is exempt (it contains panel/overlay), and the
    // unrelated sibling is inerted.
    expect(sibling.inert).toBe(true);
    expect(getElement<HTMLElement>('#wrapper').inert).toBeFalsy();

    controller.destroy();
  });

  it('dismisses on Escape and removes the listener after destroy', () => {
    document.body.innerHTML = `<div id="panel"><button id="close">Close</button></div>`;
    const panel = getElement<HTMLElement>('#panel');
    const onDismiss = vi.fn();
    const controller = createSideSheetController({ panel, onDismiss });

    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    expect(onDismiss).toHaveBeenCalledTimes(1);

    controller.destroy();
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('falls back to a tabindex on the panel when it has no focusable descendant', () => {
    document.body.innerHTML = `<div id="panel"><p>No focusable content</p></div>`;
    const panel = getElement<HTMLElement>('#panel');
    const controller = createSideSheetController({ panel, onDismiss: vi.fn() });

    expect(document.activeElement).toBe(panel);
    expect(panel.getAttribute('tabindex')).toBe('-1');

    controller.destroy();
    expect(panel.hasAttribute('tabindex')).toBe(false);
  });
});

describe('side sheet transition controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(animate).mockImplementation(() => animationControls() as never);
  });

  it('animates the container width and overlay opacity to the open state', () => {
    document.body.innerHTML = `<div id="container"></div><div id="overlay"></div>`;
    const container = getElement<HTMLElement>('#container');
    const overlay = getElement<HTMLElement>('#overlay');
    const controller = createSideSheetTransitionController({
      container,
      overlay,
    });

    controller.setOpen(true);
    expect(animate).toHaveBeenCalledWith(
      container,
      { width: 'auto' },
      { duration: 0.3 },
    );
    expect(animate).toHaveBeenCalledWith(
      overlay,
      { opacity: 1 },
      { duration: 0.3 },
    );

    controller.setOpen(false);
    expect(animate).toHaveBeenCalledWith(
      container,
      { width: '0px' },
      { duration: 0.3 },
    );
    expect(animate).toHaveBeenCalledWith(
      overlay,
      { opacity: 0 },
      { duration: 0.3 },
    );
  });

  it('applies the end state instantly when instant is passed', () => {
    document.body.innerHTML = `<div id="container"></div>`;
    const container = getElement<HTMLElement>('#container');
    const controller = createSideSheetTransitionController({ container });

    controller.setOpen(false, true);
    expect(animate).toHaveBeenCalledWith(
      container,
      { width: '0px' },
      { duration: 0 },
    );
  });

  it('applies the end state instantly when the user prefers reduced motion', () => {
    document.body.innerHTML = `<div id="container"></div>`;
    const container = getElement<HTMLElement>('#container');
    const controller = createSideSheetTransitionController({
      container,
      reducedMotion: () => true,
    });

    controller.setOpen(true);
    expect(animate).toHaveBeenCalledWith(
      container,
      { width: 'auto' },
      { duration: 0 },
    );
  });

  it('stops a running animation before starting a new one and clears the inline width once open', () => {
    document.body.innerHTML = `<div id="container"></div>`;
    const container = getElement<HTMLElement>('#container');
    const controls = animationControls();
    vi.mocked(animate).mockReturnValueOnce(controls as never);
    const controller = createSideSheetTransitionController({ container });

    controller.setOpen(true);
    expect(container.style.width).toBe('');

    controller.destroy();
    expect(controls.stop).toHaveBeenCalled();
  });
});
