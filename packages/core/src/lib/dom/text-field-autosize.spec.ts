// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTextareaAutosizeController } from './text-field-autosize.js';

function withScrollHeight(textarea: HTMLTextAreaElement, value: number) {
  Object.defineProperty(textarea, 'scrollHeight', {
    configurable: true,
    value,
  });
}

class MockResizeObserver {
  static instances: MockResizeObserver[] = [];
  callback: ResizeObserverCallback;
  observed: Element[] = [];
  disconnected = false;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    MockResizeObserver.instances.push(this);
  }

  observe(target: Element) {
    this.observed.push(target);
  }

  unobserve() {}

  disconnect() {
    this.disconnected = true;
  }

  notify() {
    // A real, disconnected ResizeObserver never invokes its callback again.
    if (this.disconnected) return;
    this.callback([] as unknown as ResizeObserverEntry[], this as never);
  }
}

describe('textarea autosize controller', () => {
  const originalResizeObserver = globalThis.ResizeObserver;

  beforeEach(() => {
    MockResizeObserver.instances = [];
    globalThis.ResizeObserver =
      MockResizeObserver as unknown as typeof ResizeObserver;
  });

  afterEach(() => {
    globalThis.ResizeObserver = originalResizeObserver;
  });

  it('resizes to the scroll height on creation', () => {
    const textarea = document.createElement('textarea');
    withScrollHeight(textarea, 84);

    createTextareaAutosizeController({ textarea });

    expect(textarea.style.height).toBe('84px');
  });

  it('forces rows to 1, so a single line measures against its real content height instead of the 2-row default', () => {
    const textarea = document.createElement('textarea');
    withScrollHeight(textarea, 20);

    createTextareaAutosizeController({ textarea });

    expect(textarea.rows).toBe(1);
  });

  it('re-measures on input events', () => {
    const textarea = document.createElement('textarea');
    withScrollHeight(textarea, 40);
    createTextareaAutosizeController({ textarea });

    withScrollHeight(textarea, 120);
    textarea.dispatchEvent(new Event('input'));

    expect(textarea.style.height).toBe('120px');
  });

  it('re-measures on an explicit update() call', () => {
    const textarea = document.createElement('textarea');
    withScrollHeight(textarea, 40);
    const controller = createTextareaAutosizeController({ textarea });

    withScrollHeight(textarea, 200);
    controller.update();

    expect(textarea.style.height).toBe('200px');
  });

  it('observes the textarea with a ResizeObserver', () => {
    const textarea = document.createElement('textarea');
    withScrollHeight(textarea, 40);

    createTextareaAutosizeController({ textarea });

    expect(MockResizeObserver.instances).toHaveLength(1);
    expect(MockResizeObserver.instances[0].observed).toEqual([textarea]);
  });

  it('re-measures when the ResizeObserver reports an external size change -- e.g. the field becoming visible after being created while display: none, when scrollHeight only ever measured 0', () => {
    const textarea = document.createElement('textarea');
    // Simulates creation while hidden: no real box, so scrollHeight is 0
    // no matter how many times resize() runs at that point.
    withScrollHeight(textarea, 0);
    createTextareaAutosizeController({ textarea });
    expect(textarea.style.height).toBe('0px');

    // The field becomes visible; scrollHeight now measures real content.
    withScrollHeight(textarea, 60);
    MockResizeObserver.instances[0].notify();

    expect(textarea.style.height).toBe('60px');
  });

  it('settles instead of looping once a re-measure applies the same height again', () => {
    const textarea = document.createElement('textarea');
    withScrollHeight(textarea, 40);
    createTextareaAutosizeController({ textarea });
    expect(textarea.style.height).toBe('40px');

    // scrollHeight hasn't changed, so re-measuring must be a no-op that
    // doesn't throw or recurse -- this is what keeps resize() safe to call
    // unconditionally from every ResizeObserver notification, including
    // ones it caused itself.
    MockResizeObserver.instances[0].notify();

    expect(textarea.style.height).toBe('40px');
  });

  it('stops listening and disconnects the observer after destroy()', () => {
    const textarea = document.createElement('textarea');
    withScrollHeight(textarea, 40);
    const controller = createTextareaAutosizeController({ textarea });
    controller.destroy();

    withScrollHeight(textarea, 999);
    textarea.dispatchEvent(new Event('input'));
    MockResizeObserver.instances[0].notify();

    expect(textarea.style.height).toBe('40px');
    expect(MockResizeObserver.instances[0].disconnected).toBe(true);
  });
});
