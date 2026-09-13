// @vitest-environment jsdom

import { animate } from 'animejs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  addPointerEnterLeaveListener,
  claimTooltipVisibility,
  createTooltipTransitionController,
  createTooltipTriggerController,
  listenForTooltipVisibilityClaims,
  type TooltipTriggerController,
  type TooltipTriggerControllerOptions,
} from './tooltip.js';

vi.mock('animejs', () => ({ animate: vi.fn() }));

describe('tooltip visibility coordination', () => {
  it('notifies every tooltip except the one claiming visibility', () => {
    const firstDismissed = vi.fn();
    const secondDismissed = vi.fn();
    const removeFirst = listenForTooltipVisibilityClaims(
      document,
      'first',
      firstDismissed,
    );
    const removeSecond = listenForTooltipVisibilityClaims(
      document,
      'second',
      secondDismissed,
    );

    claimTooltipVisibility(document, 'second');

    expect(firstDismissed).toHaveBeenCalledOnce();
    expect(secondDismissed).not.toHaveBeenCalled();
    removeFirst();
    removeSecond();
  });
});

function animationInstance() {
  return { pause: vi.fn() };
}

describe('tooltip transition controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('animates opacity and height to the open state with the default transition', () => {
    const instance = animationInstance();
    vi.mocked(animate).mockReturnValue(instance as never);
    const element = document.createElement('div');
    Object.defineProperty(element, 'scrollHeight', { value: 48 });

    const controller = createTooltipTransitionController({
      element,
      reducedMotion: () => false,
    });
    controller.setOpen(true);

    expect(animate).toHaveBeenCalledWith(
      element,
      expect.objectContaining({
        opacity: 1,
        height: '48px',
        duration: 300,
        ease: 'outCubic',
        onComplete: expect.any(Function),
      }),
    );
  });

  it('animates opacity and height to the closed state', () => {
    const instance = animationInstance();
    vi.mocked(animate).mockReturnValue(instance as never);
    const element = document.createElement('div');

    const controller = createTooltipTransitionController({
      element,
      reducedMotion: () => false,
    });
    controller.setOpen(false);

    expect(animate).toHaveBeenCalledWith(
      element,
      expect.objectContaining({ opacity: 0, height: '16px' }),
    );
  });

  it('stops hit-testing while closed and resumes when opening', () => {
    const instance = animationInstance();
    vi.mocked(animate).mockReturnValue(instance as never);
    const element = document.createElement('div');

    const controller = createTooltipTransitionController({
      element,
      reducedMotion: () => false,
    });
    controller.setOpen(false);
    expect(element.style.pointerEvents).toBe('none');

    controller.setOpen(true);
    expect(element.style.pointerEvents).toBe('');
  });

  it('restores natural height after the opening animation', () => {
    const instance = animationInstance();
    vi.mocked(animate).mockReturnValue(instance as never);
    const element = document.createElement('div');
    Object.defineProperty(element, 'scrollHeight', { value: 40 });

    const controller = createTooltipTransitionController({
      element,
      reducedMotion: () => false,
    });
    controller.setOpen(true);
    const options = vi.mocked(animate).mock.calls[0][1];
    (options.onComplete as () => void)();

    expect(element.style.height).toBe('auto');
    expect(element.style.overflow).toBe('visible');
  });

  it('uses a zero duration when instant is requested', () => {
    const instance = animationInstance();
    vi.mocked(animate).mockReturnValue(instance as never);
    const element = document.createElement('div');

    const controller = createTooltipTransitionController({
      element,
      reducedMotion: () => false,
    });
    controller.setOpen(true, true);

    expect(animate).toHaveBeenCalledWith(
      element,
      expect.objectContaining({ duration: 0 }),
    );
  });

  it('uses a zero duration when the user prefers reduced motion', () => {
    const instance = animationInstance();
    vi.mocked(animate).mockReturnValue(instance as never);
    const element = document.createElement('div');

    const controller = createTooltipTransitionController({
      element,
      reducedMotion: () => true,
    });
    controller.setOpen(true);

    expect(animate).toHaveBeenCalledWith(
      element,
      expect.objectContaining({ duration: 0 }),
    );
  });

  it('honors a custom transition duration and ease', () => {
    const instance = animationInstance();
    vi.mocked(animate).mockReturnValue(instance as never);
    const element = document.createElement('div');

    const controller = createTooltipTransitionController({
      element,
      transition: { duration: 400, ease: 'inOutQuad' },
      reducedMotion: () => false,
    });
    controller.setOpen(true);

    expect(animate).toHaveBeenCalledWith(
      element,
      expect.objectContaining({ duration: 400, ease: 'inOutQuad' }),
    );
  });

  it('pauses the in-flight animation before starting a new one', () => {
    const first = animationInstance();
    const second = animationInstance();
    vi.mocked(animate)
      .mockReturnValueOnce(first as never)
      .mockReturnValueOnce(second as never);
    const element = document.createElement('div');

    const controller = createTooltipTransitionController({
      element,
      reducedMotion: () => false,
    });
    controller.setOpen(true);
    controller.setOpen(false);

    expect(first.pause).toHaveBeenCalledTimes(1);
  });

  it('pauses the in-flight animation on destroy', () => {
    const instance = animationInstance();
    vi.mocked(animate).mockReturnValue(instance as never);
    const element = document.createElement('div');

    const controller = createTooltipTransitionController({
      element,
      reducedMotion: () => false,
    });
    controller.setOpen(true);
    controller.destroy();

    expect(instance.pause).toHaveBeenCalledTimes(1);
  });
});

describe('addPointerEnterLeaveListener', () => {
  function fireMouseOver(
    target: EventTarget,
    relatedTarget: EventTarget | null,
  ) {
    target.dispatchEvent(
      new MouseEvent('mouseover', { bubbles: true, relatedTarget }),
    );
  }
  function fireMouseOut(
    target: EventTarget,
    relatedTarget: EventTarget | null,
  ) {
    target.dispatchEvent(
      new MouseEvent('mouseout', { bubbles: true, relatedTarget }),
    );
  }

  it('fires onEnter when the pointer arrives from outside the element', () => {
    const outside = document.createElement('div');
    const element = document.createElement('div');
    document.body.append(outside, element);
    const onEnter = vi.fn();
    const onLeave = vi.fn();
    addPointerEnterLeaveListener(element, { onEnter, onLeave });

    fireMouseOver(element, outside);

    expect(onEnter).toHaveBeenCalledTimes(1);
    expect(onLeave).not.toHaveBeenCalled();
  });

  it('does not fire onEnter when moving between two nodes already inside the element', () => {
    const element = document.createElement('div');
    const inner1 = document.createElement('span');
    const inner2 = document.createElement('span');
    element.append(inner1, inner2);
    document.body.append(element);
    const onEnter = vi.fn();
    addPointerEnterLeaveListener(element, { onEnter, onLeave: vi.fn() });

    fireMouseOver(inner2, inner1);

    expect(onEnter).not.toHaveBeenCalled();
  });

  it('fires onEnter through a display:contents wrapper via bubbling -- the scenario mouseenter cannot handle', () => {
    // Simulates an Angular component host rendered `display: contents`
    // (every interactive Udixio component): the pointer enters the real
    // inner element, and the event must still bubble up to a listener on
    // the outer wrapper.
    const outside = document.createElement('div');
    const wrapper = document.createElement('div');
    wrapper.style.display = 'contents';
    const inner = document.createElement('button');
    wrapper.append(inner);
    document.body.append(outside, wrapper);
    const onEnter = vi.fn();
    addPointerEnterLeaveListener(wrapper, { onEnter, onLeave: vi.fn() });

    // The browser dispatches mouseover at the actually-entered element
    // (`inner`); it then bubbles up through `wrapper`.
    fireMouseOver(inner, outside);

    expect(onEnter).toHaveBeenCalledTimes(1);
  });

  it('fires onLeave when the pointer departs to outside the element', () => {
    const element = document.createElement('div');
    const outside = document.createElement('div');
    document.body.append(element, outside);
    const onLeave = vi.fn();
    addPointerEnterLeaveListener(element, { onEnter: vi.fn(), onLeave });

    fireMouseOut(element, outside);

    expect(onLeave).toHaveBeenCalledTimes(1);
  });

  it('treats a null relatedTarget (leaving the window) as a leave', () => {
    const element = document.createElement('div');
    document.body.append(element);
    const onLeave = vi.fn();
    addPointerEnterLeaveListener(element, { onEnter: vi.fn(), onLeave });

    fireMouseOut(element, null);

    expect(onLeave).toHaveBeenCalledTimes(1);
  });

  it('stops listening once destroyed', () => {
    const element = document.createElement('div');
    const outside = document.createElement('div');
    document.body.append(element, outside);
    const onEnter = vi.fn();
    const destroy = addPointerEnterLeaveListener(element, {
      onEnter,
      onLeave: vi.fn(),
    });

    destroy();
    fireMouseOver(element, outside);

    expect(onEnter).not.toHaveBeenCalled();
  });
});

describe('tooltip trigger controller', () => {
  function setup(
    overrides: Partial<TooltipTriggerControllerOptions> = {},
  ): {
    target: HTMLElement;
    onStateChange: ReturnType<typeof vi.fn>;
    controller: TooltipTriggerController;
  } {
    const target = document.createElement('button');
    document.body.append(target);
    const onStateChange = vi.fn();
    const controller = createTooltipTriggerController({
      target,
      tooltipId: 'tooltip-1',
      triggers: () => ['hover', 'focus'],
      openDelay: () => 400,
      closeDelay: () => 150,
      describeTarget: () => true,
      isControlled: () => false,
      onStateChange,
      ...overrides,
    });
    return { target, onStateChange, controller };
  }

  function fireMouseOver(target: EventTarget, relatedTarget: EventTarget | null) {
    target.dispatchEvent(
      new MouseEvent('mouseover', { bubbles: true, relatedTarget }),
    );
  }

  function fireMouseOut(target: EventTarget, relatedTarget: EventTarget | null) {
    target.dispatchEvent(
      new MouseEvent('mouseout', { bubbles: true, relatedTarget }),
    );
  }

  it('opens only after the open delay has elapsed', () => {
    vi.useFakeTimers();
    const { target, onStateChange, controller } = setup();
    const outside = document.createElement('div');
    document.body.append(outside);

    fireMouseOver(target, outside);
    expect(onStateChange).not.toHaveBeenCalled();

    vi.advanceTimersByTime(399);
    expect(onStateChange).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onStateChange).toHaveBeenCalledWith('hovered', false);

    controller.destroy();
    vi.useRealTimers();
  });

  it('closes only after the close delay has elapsed', () => {
    vi.useFakeTimers();
    const { target, onStateChange, controller } = setup();
    const outside = document.createElement('div');
    document.body.append(outside);

    fireMouseOver(target, outside);
    vi.advanceTimersByTime(400);
    onStateChange.mockClear();

    fireMouseOut(target, outside);
    vi.advanceTimersByTime(149);
    expect(onStateChange).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onStateChange).toHaveBeenCalledWith('hidden', false);

    controller.destroy();
    vi.useRealTimers();
  });

  it('opens on focus without waiting for the open delay', () => {
    const { target, onStateChange, controller } = setup();

    target.dispatchEvent(new FocusEvent('focus'));

    expect(onStateChange).toHaveBeenCalledWith('focused', false);
    controller.destroy();
  });

  it('waits the close delay before closing on blur', () => {
    vi.useFakeTimers();
    const { target, onStateChange, controller } = setup();
    target.dispatchEvent(new FocusEvent('focus'));
    onStateChange.mockClear();

    target.dispatchEvent(new FocusEvent('blur'));
    expect(onStateChange).not.toHaveBeenCalled();

    vi.advanceTimersByTime(150);
    expect(onStateChange).toHaveBeenCalledWith('hidden', false);

    controller.destroy();
    vi.useRealTimers();
  });

  it('toggles on click when click is a trigger', () => {
    const { target, onStateChange, controller } = setup({
      triggers: () => ['click'],
    });

    target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onStateChange).toHaveBeenLastCalledWith('clicked', false);

    target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onStateChange).toHaveBeenLastCalledWith('hidden', false);

    controller.destroy();
  });

  it('closes on Escape and prevents the default action', () => {
    const { target, onStateChange, controller } = setup();
    target.dispatchEvent(new FocusEvent('focus'));
    onStateChange.mockClear();

    const event = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    target.dispatchEvent(event);

    expect(onStateChange).toHaveBeenCalledWith('hidden', false);
    expect(event.defaultPrevented).toBe(true);
    controller.destroy();
  });

  it('ignores Escape while already hidden, leaving the event alone', () => {
    const { target, onStateChange, controller } = setup();

    const event = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    target.dispatchEvent(event);

    expect(onStateChange).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
    controller.destroy();
  });

  it('keeps the tooltip open when the pointer moves onto the surface', () => {
    vi.useFakeTimers();
    const { target, onStateChange, controller } = setup();
    const outside = document.createElement('div');
    document.body.append(outside);
    fireMouseOver(target, outside);
    vi.advanceTimersByTime(400);
    onStateChange.mockClear();

    controller.setSurfaceHovered(true);
    fireMouseOut(target, outside);
    vi.advanceTimersByTime(1000);

    expect(onStateChange).not.toHaveBeenCalled();
    controller.destroy();
    vi.useRealTimers();
  });

  it('adds and removes aria-describedby on the trigger as it opens and closes', () => {
    vi.useFakeTimers();
    const { target, controller } = setup();
    const outside = document.createElement('div');
    document.body.append(outside);

    fireMouseOver(target, outside);
    vi.advanceTimersByTime(400);
    expect(target.getAttribute('aria-describedby')).toBe('tooltip-1');

    fireMouseOut(target, outside);
    vi.advanceTimersByTime(150);
    expect(target.hasAttribute('aria-describedby')).toBe(false);

    controller.destroy();
    vi.useRealTimers();
  });

  it('preserves a pre-existing aria-describedby token', () => {
    vi.useFakeTimers();
    const { target, controller } = setup();
    target.setAttribute('aria-describedby', 'hint-1');
    const outside = document.createElement('div');
    document.body.append(outside);

    fireMouseOver(target, outside);
    vi.advanceTimersByTime(400);
    expect(target.getAttribute('aria-describedby')).toBe('hint-1 tooltip-1');

    fireMouseOut(target, outside);
    vi.advanceTimersByTime(150);
    expect(target.getAttribute('aria-describedby')).toBe('hint-1');

    controller.destroy();
    vi.useRealTimers();
  });

  it('leaves aria-describedby alone when describeTarget is false', () => {
    vi.useFakeTimers();
    const { target, controller } = setup({ describeTarget: () => false });
    const outside = document.createElement('div');
    document.body.append(outside);

    fireMouseOver(target, outside);
    vi.advanceTimersByTime(400);

    expect(target.hasAttribute('aria-describedby')).toBe(false);
    controller.destroy();
    vi.useRealTimers();
  });

  it('drops aria-describedby when destroyed while open', () => {
    vi.useFakeTimers();
    const { target, controller } = setup();
    const outside = document.createElement('div');
    document.body.append(outside);
    fireMouseOver(target, outside);
    vi.advanceTimersByTime(400);

    controller.destroy();

    expect(target.hasAttribute('aria-describedby')).toBe(false);
    vi.useRealTimers();
  });

  it('reports suppression when another tooltip claims visibility', () => {
    vi.useFakeTimers();
    const { target, onStateChange, controller } = setup();
    const outside = document.createElement('div');
    document.body.append(outside);
    fireMouseOver(target, outside);
    vi.advanceTimersByTime(400);
    onStateChange.mockClear();

    claimTooltipVisibility(document, 'some-other-tooltip');

    expect(onStateChange).toHaveBeenCalledWith('hidden', true);
    controller.destroy();
    vi.useRealTimers();
  });

  it('claims visibility for itself when it opens', () => {
    vi.useFakeTimers();
    const peerDismissed = vi.fn();
    const removePeer = listenForTooltipVisibilityClaims(
      document,
      'peer',
      peerDismissed,
    );
    const { target, controller } = setup();
    const outside = document.createElement('div');
    document.body.append(outside);

    fireMouseOver(target, outside);
    vi.advanceTimersByTime(400);

    expect(peerDismissed).toHaveBeenCalledOnce();
    removePeer();
    controller.destroy();
    vi.useRealTimers();
  });

  it('does not drive its own state in controlled mode, but still reports the request', () => {
    vi.useFakeTimers();
    const { target, onStateChange, controller } = setup({
      isControlled: () => true,
    });
    const outside = document.createElement('div');
    document.body.append(outside);

    fireMouseOver(target, outside);
    vi.advanceTimersByTime(400);
    expect(onStateChange).toHaveBeenCalledWith('hovered', false);

    // The adapter has not accepted the request, so the machine must still
    // consider itself hidden and accept a fresh open request.
    onStateChange.mockClear();
    fireMouseOut(target, outside);
    vi.advanceTimersByTime(150);
    expect(onStateChange).not.toHaveBeenCalled();

    controller.destroy();
    vi.useRealTimers();
  });

  // jsdom ships no `PointerEvent`; the Angular tooltip spec solves this the
  // same way, by decorating a plain Event with the properties read.
  function firePointer(
    target: EventTarget,
    type: string,
    init: Record<string, unknown> = {},
  ) {
    const event = new Event(type, { bubbles: true, cancelable: true });
    Object.entries({
      pointerId: 1,
      pointerType: 'touch',
      ...init,
    }).forEach(([key, value]) =>
      Object.defineProperty(event, key, { value }),
    );
    target.dispatchEvent(event);
  }

  it('opens after a touch long press of 500ms', () => {
    vi.useFakeTimers();
    const { target, onStateChange, controller } = setup();

    firePointer(target, 'pointerdown', { clientX: 10, clientY: 10 });
    vi.advanceTimersByTime(499);
    expect(onStateChange).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onStateChange).toHaveBeenCalledWith('hovered', false);

    controller.destroy();
    vi.useRealTimers();
  });

  it('keeps a touch-opened tooltip visible for 1.5s after release', () => {
    vi.useFakeTimers();
    const { target, onStateChange, controller } = setup();
    firePointer(target, 'pointerdown', { clientX: 10, clientY: 10 });
    vi.advanceTimersByTime(500);
    onStateChange.mockClear();

    firePointer(target, 'pointerup', { clientX: 10, clientY: 10 });
    vi.advanceTimersByTime(1499);
    expect(onStateChange).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onStateChange).toHaveBeenCalledWith('hidden', false);

    controller.destroy();
    vi.useRealTimers();
  });

  it('cancels a pending long press when the finger moves beyond the tolerance', () => {
    vi.useFakeTimers();
    const { target, onStateChange, controller } = setup();

    firePointer(target, 'pointerdown', { clientX: 10, clientY: 10 });
    firePointer(target, 'pointermove', { clientX: 30, clientY: 10 });
    vi.advanceTimersByTime(1000);

    expect(onStateChange).not.toHaveBeenCalled();
    controller.destroy();
    vi.useRealTimers();
  });

  it('tolerates a small finger drift without cancelling the long press', () => {
    vi.useFakeTimers();
    const { target, onStateChange, controller } = setup();

    firePointer(target, 'pointerdown', { clientX: 10, clientY: 10 });
    firePointer(target, 'pointermove', { clientX: 15, clientY: 10 });
    vi.advanceTimersByTime(500);

    expect(onStateChange).toHaveBeenCalledWith('hovered', false);
    controller.destroy();
    vi.useRealTimers();
  });

  it('ignores a non-touch pointer, leaving mouse handling to hover', () => {
    vi.useFakeTimers();
    const { target, onStateChange, controller } = setup();

    firePointer(target, 'pointerdown', {
      pointerType: 'mouse',
      clientX: 10,
      clientY: 10,
    });
    vi.advanceTimersByTime(1000);

    expect(onStateChange).not.toHaveBeenCalled();
    controller.destroy();
    vi.useRealTimers();
  });

  it('suppresses the synthetic hover that follows a touch', () => {
    vi.useFakeTimers();
    const { target, onStateChange, controller } = setup();
    const outside = document.createElement('div');
    document.body.append(outside);

    firePointer(target, 'pointerdown', { clientX: 10, clientY: 10 });
    fireMouseOver(target, outside);
    vi.advanceTimersByTime(400);

    expect(onStateChange).not.toHaveBeenCalled();
    controller.destroy();
    vi.useRealTimers();
  });

  it('suppresses the synthetic click that follows a touch long press', () => {
    vi.useFakeTimers();
    const { target, onStateChange, controller } = setup({
      triggers: () => ['hover', 'click'],
    });
    firePointer(target, 'pointerdown', { clientX: 10, clientY: 10 });
    vi.advanceTimersByTime(500);
    onStateChange.mockClear();

    target.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(onStateChange).not.toHaveBeenCalled();
    controller.destroy();
    vi.useRealTimers();
  });

  it('prevents the context menu while a touch press is in flight', () => {
    vi.useFakeTimers();
    const { target, controller } = setup();
    firePointer(target, 'pointerdown', { clientX: 10, clientY: 10 });

    const event = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
    });
    target.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    controller.destroy();
    vi.useRealTimers();
  });

  it('leaves the context menu alone without a touch press', () => {
    const { target, controller } = setup();

    const event = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
    });
    target.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    controller.destroy();
  });

  it('closes after the close delay when the pointer leaves the surface', () => {
    vi.useFakeTimers();
    const { target, onStateChange, controller } = setup();
    const outside = document.createElement('div');
    document.body.append(outside);
    fireMouseOver(target, outside);
    vi.advanceTimersByTime(400);
    controller.setSurfaceHovered(true);
    fireMouseOut(target, outside);
    onStateChange.mockClear();

    controller.setSurfaceHovered(false);
    vi.advanceTimersByTime(150);

    expect(onStateChange).toHaveBeenCalledWith('hidden', false);
    controller.destroy();
    vi.useRealTimers();
  });

  it('claims visibility when the adapter pushes an open controlled state', () => {
    const peerDismissed = vi.fn();
    const removePeer = listenForTooltipVisibilityClaims(
      document,
      'peer',
      peerDismissed,
    );
    const { controller } = setup({ isControlled: () => true });

    controller.setControlledState('hovered');

    expect(peerDismissed).toHaveBeenCalledOnce();
    removePeer();
    controller.destroy();
  });

  it('describes the trigger when the adapter pushes an open controlled state', () => {
    const { target, controller } = setup({ isControlled: () => true });

    controller.setControlledState('hovered');
    expect(target.getAttribute('aria-describedby')).toBe('tooltip-1');

    controller.setControlledState('hidden');
    expect(target.hasAttribute('aria-describedby')).toBe(false);

    controller.destroy();
  });

  it('stops listening to the trigger once destroyed', () => {
    vi.useFakeTimers();
    const { target, onStateChange, controller } = setup();
    const outside = document.createElement('div');
    document.body.append(outside);

    controller.destroy();
    fireMouseOver(target, outside);
    vi.advanceTimersByTime(400);

    expect(onStateChange).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
