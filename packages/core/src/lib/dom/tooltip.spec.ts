// @vitest-environment jsdom

import { animate } from 'animejs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  addPointerEnterLeaveListener,
  claimTooltipVisibility,
  createTooltipTransitionController,
  listenForTooltipVisibilityClaims,
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

  it('animates opacity and scale to the open state with the default transition', () => {
    const instance = animationInstance();
    vi.mocked(animate).mockReturnValue(instance as never);
    const element = document.createElement('div');

    const controller = createTooltipTransitionController({
      element,
      reducedMotion: () => false,
    });
    controller.setOpen(true);

    expect(animate).toHaveBeenCalledWith(
      element,
      expect.objectContaining({
        opacity: 1,
        scale: 1,
        duration: 150,
        ease: 'outCubic',
      }),
    );
  });

  it('animates opacity and scale to the closed state', () => {
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
      expect.objectContaining({ opacity: 0, scale: 0.8 }),
    );
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
