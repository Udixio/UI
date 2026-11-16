import { afterEach, describe, expect, it, vi } from 'vitest';
import { press } from './press.js';

function pointer(type: string, init: PointerEventInit = {}): PointerEvent {
  return new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    button: 0,
    isPrimary: true,
    pointerId: 1,
    pointerType: 'mouse',
    ...init,
  });
}

function key(type: 'keydown' | 'keyup' | 'blur', value: string, init: KeyboardEventInit = {}): KeyboardEvent {
  return new KeyboardEvent(type, { bubbles: true, cancelable: true, key: value, ...init });
}

describe('press gesture in the browser', () => {
  let detach: (() => void) | undefined;
  let button: HTMLButtonElement;

  afterEach(() => {
    detach?.();
    detach = undefined;
    document.body.innerHTML = '';
  });

  function mount(): HTMLButtonElement {
    document.body.innerHTML = '<button type="button"><span>label</span></button>';
    button = document.querySelector('button')!;
    return button;
  }

  it('starts on a primary pointer down and ends when that pointer is released, even off the element', () => {
    const end = vi.fn();
    detach = press(mount(), () => end);

    button.dispatchEvent(pointer('pointerdown'));
    expect(end).not.toHaveBeenCalled();

    document.body.dispatchEvent(pointer('pointerup'));
    expect(end).toHaveBeenCalledTimes(1);
  });

  it('ends on pointercancel, and ignores the release of another pointer', () => {
    const end = vi.fn();
    detach = press(mount(), () => end);

    button.dispatchEvent(pointer('pointerdown'));
    window.dispatchEvent(pointer('pointerup', { pointerId: 7 }));
    expect(end).not.toHaveBeenCalled();

    window.dispatchEvent(pointer('pointercancel'));
    expect(end).toHaveBeenCalledTimes(1);
  });

  it('ignores a pointer down that is not the primary button or pointer', () => {
    const onStart = vi.fn();
    detach = press(mount(), onStart);

    button.dispatchEvent(pointer('pointerdown', { button: 1 }));
    button.dispatchEvent(pointer('pointerdown', { isPrimary: false, pointerId: 2 }));

    expect(onStart).not.toHaveBeenCalled();
  });

  it('does not start a second press while one is active on the element', () => {
    const onStart = vi.fn(() => vi.fn());
    detach = press(mount(), onStart);

    button.dispatchEvent(pointer('pointerdown'));
    button.dispatchEvent(pointer('pointerdown', { pointerId: 2 }));
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('hands the starting event to the callback, which can ignore the press', () => {
    const received: Array<PointerEvent | KeyboardEvent> = [];
    detach = press(mount(), (event) => {
      received.push(event);
    });

    button.dispatchEvent(pointer('pointerdown'));
    document.body.dispatchEvent(pointer('pointerup'));

    expect(received).toHaveLength(1);
    expect(received[0]).toBeInstanceOf(PointerEvent);
  });

  it('starts on Enter and on Space, and ends on the matching key release', () => {
    const end = vi.fn();
    detach = press(mount(), () => end);

    button.dispatchEvent(key('keydown', 'Enter'));
    button.dispatchEvent(key('keyup', ' '));
    expect(end).not.toHaveBeenCalled();
    button.dispatchEvent(key('keyup', 'Enter'));
    expect(end).toHaveBeenCalledTimes(1);

    button.dispatchEvent(key('keydown', ' '));
    button.dispatchEvent(key('keyup', ' '));
    expect(end).toHaveBeenCalledTimes(2);
  });

  it('ignores other keys, repeated keys, and keys pressed on a descendant', () => {
    const onStart = vi.fn();
    detach = press(mount(), onStart);

    button.dispatchEvent(key('keydown', 'a'));
    button.dispatchEvent(key('keydown', 'Enter', { repeat: true }));
    button.querySelector('span')!.dispatchEvent(key('keydown', 'Enter'));

    expect(onStart).not.toHaveBeenCalled();
  });

  it('ends a keyboard press when the element loses focus', () => {
    const end = vi.fn();
    detach = press(mount(), () => end);

    button.dispatchEvent(key('keydown', 'Enter'));
    button.dispatchEvent(new FocusEvent('blur'));

    expect(end).toHaveBeenCalledTimes(1);
  });

  it('drops a press in progress without running its callback when detached', () => {
    const end = vi.fn();
    const stop = press(mount(), () => end);

    button.dispatchEvent(pointer('pointerdown'));
    stop();
    document.body.dispatchEvent(pointer('pointerup'));
    button.dispatchEvent(pointer('pointerdown'));

    expect(end).not.toHaveBeenCalled();
  });
});
