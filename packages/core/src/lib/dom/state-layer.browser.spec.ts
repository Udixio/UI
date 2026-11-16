import { afterEach, describe, expect, it, vi } from 'vitest';
import type { StateLayerShapeMotion } from '../interfaces/state-layer.interface.js';
import {
  createStateLayerController,
  findStateLayerTrigger,
  type StateLayerController,
} from './state-layer.js';

const shape: StateLayerShapeMotion = {
  restingBorderRadius: '40px',
  pressedBorderRadius: '16px',
  enabled: true,
  timing: 'spring.fast.spatial',
};

/** A button with its state layer, mounted in the document; the trigger carries its resting radius inline. */
function mount(): { trigger: HTMLButtonElement; layer: HTMLSpanElement } {
  document.body.innerHTML = `
    <div class="group/button"><button type="button" style="position: relative; width: 120px; height: 48px; border-radius: 40px"><span style="position: absolute; inset: 0"></span></button></div>
  `;
  const trigger = document.querySelector('button')!;
  return { trigger, layer: trigger.querySelector('span')! };
}

function pointer(type: string, init: PointerEventInit = {}): PointerEvent {
  return new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    button: 0,
    isPrimary: true,
    pointerId: 1,
    pointerType: 'mouse',
    clientX: 60,
    clientY: 24,
    ...init,
  });
}

/** Resolves once every animation of the element has finished. */
const settled = (element: Element) =>
  Promise.all(element.getAnimations().map((animation) => animation.finished));

const ripplesOf = (layer: HTMLElement) =>
  layer.querySelectorAll<HTMLElement>('[data-udixio-ripple]');

describe('state layer controller in the browser', () => {
  let controller: StateLayerController | undefined;

  afterEach(() => {
    controller?.destroy();
    controller = undefined;
    document.documentElement.removeAttribute('data-motion-policy');
    document.body.innerHTML = '';
  });

  it('morphs the trigger to its pressed radius on press, and back to the resting radius on release', async () => {
    const { trigger, layer } = mount();
    controller = createStateLayerController({ trigger, layer });
    controller.updateShape(shape);
    expect(trigger.style.borderRadius).toBe('40px');
    expect(layer.style.borderRadius).toBe('inherit');

    trigger.dispatchEvent(pointer('pointerdown'));
    await settled(trigger);
    expect(getComputedStyle(trigger).borderRadius).toBe('16px');

    trigger.dispatchEvent(pointer('pointerup'));
    await Promise.resolve();
    await settled(trigger);
    expect(getComputedStyle(trigger).borderRadius).toBe('40px');
  });

  it('times a curve motion of the shape with its duration token and easing', async () => {
    const { trigger, layer } = mount();
    controller = createStateLayerController({ trigger, layer });
    controller.updateShape({
      ...shape,
      timing: { duration: 'duration.long2', easing: 'easing.standard' },
    });

    trigger.dispatchEvent(pointer('pointerdown'));
    const [morph] = trigger.getAnimations();
    expect(morph!.effect!.getComputedTiming().duration).toBe(500);
    expect((morph!.effect as KeyframeEffect).getTiming().easing).toBe('cubic-bezier(0.2, 0, 0, 1)');
    await settled(trigger);
    expect(getComputedStyle(trigger).borderRadius).toBe('16px');
  });

  it('starts a morph interrupted by a release from the radius the trigger shows, not from the resting one', async () => {
    const { trigger, layer } = mount();
    controller = createStateLayerController({ trigger, layer });
    controller.updateShape(shape);

    trigger.dispatchEvent(pointer('pointerdown'));
    const [pressing] = trigger.getAnimations();
    pressing!.pause();
    pressing!.currentTime = 120;
    const shown = getComputedStyle(trigger).borderRadius;
    expect(Math.abs(parseFloat(shown) - 40)).toBeGreaterThan(1);

    trigger.dispatchEvent(pointer('pointerup'));
    await Promise.resolve();
    const [releasing] = trigger.getAnimations();
    expect(releasing).toBeDefined();
    expect(releasing).not.toBe(pressing);
    const [first] = (releasing!.effect as KeyframeEffect).getKeyframes();
    expect(parseFloat(String(first!.borderRadius))).toBeCloseTo(parseFloat(shown), 1);
  });

  it('grows the ripple from 0% to 100% of its radius, which interpolates as a registered property', async () => {
    const { trigger, layer } = mount();
    controller = createStateLayerController({ trigger, layer });
    controller.updateShape(shape);

    trigger.dispatchEvent(pointer('pointerdown'));
    const [ripple] = ripplesOf(layer);
    const [grow] = ripple!.getAnimations();
    expect(grow!.effect!.getComputedTiming().duration).toBe(500);
    expect((grow!.effect as KeyframeEffect).getKeyframes()).toHaveLength(2);
    grow!.pause();
    grow!.currentTime = 250;
    const middle = getComputedStyle(ripple!).getPropertyValue('--udixio-ripple-radius').trim();
    expect(middle).not.toBe('0%');
    expect(middle).not.toBe('100%');

    grow!.finish();
    await grow!.finished;
    expect(ripple!.style.getPropertyValue('--udixio-ripple-radius')).toBe('100%');
  });

  it('creates a ripple on press, and removes it once its fade ends after release', async () => {
    const { trigger, layer } = mount();
    controller = createStateLayerController({ trigger, layer });

    trigger.dispatchEvent(pointer('pointerdown'));
    const [ripple] = ripplesOf(layer);
    expect(ripple).toBeDefined();
    expect(ripple!.getAttribute('aria-hidden')).toBe('true');

    trigger.dispatchEvent(pointer('pointerup'));
    const fade = ripple!
      .getAnimations()
      .find((animation) => animation.effect!.getComputedTiming().duration === 300);
    expect(fade).toBeDefined();
    await vi.waitFor(() => expect(ripple!.isConnected).toBe(false), { timeout: 4000 });
  });

  it('creates no ripple under the reduced motion policy, and shows the pressed radius at once', () => {
    document.documentElement.setAttribute('data-motion-policy', 'reduce');
    const { trigger, layer } = mount();
    controller = createStateLayerController({ trigger, layer });
    controller.updateShape(shape);

    trigger.dispatchEvent(pointer('pointerdown'));

    expect(ripplesOf(layer)).toHaveLength(0);
    expect(trigger.style.borderRadius).toBe('16px');
    expect(trigger.getAnimations()).toHaveLength(0);
  });

  it('creates no ripple while disabled', () => {
    const { trigger, layer } = mount();
    controller = createStateLayerController({ trigger, layer, disabled: () => true });

    trigger.dispatchEvent(pointer('pointerdown'));

    expect(ripplesOf(layer)).toHaveLength(0);
    expect(trigger.getAnimations()).toHaveLength(0);
  });

  it('ignores a pointer press with a button other than the primary one', () => {
    const { trigger, layer } = mount();
    controller = createStateLayerController({ trigger, layer });
    controller.updateShape(shape);

    trigger.dispatchEvent(pointer('pointerdown', { button: 2 }));
    trigger.dispatchEvent(pointer('pointerdown', { isPrimary: false, pointerId: 2 }));

    expect(ripplesOf(layer)).toHaveLength(0);
    expect(trigger.getAnimations()).toHaveLength(0);
  });

  it('presses from the keyboard with Enter and with Space, and centres the ripple', async () => {
    const { trigger, layer } = mount();
    controller = createStateLayerController({ trigger, layer });
    controller.updateShape(shape);

    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    const [enter] = ripplesOf(layer);
    expect(enter!.style.getPropertyValue('--udixio-ripple-x')).toBe('50%');
    await settled(trigger);
    expect(getComputedStyle(trigger).borderRadius).toBe('16px');

    trigger.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(ripplesOf(layer)).toHaveLength(2);

    trigger.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', bubbles: true }));
    await vi.waitFor(() => expect(enter!.isConnected).toBe(false), { timeout: 4000 });
  });

  it('removes its ripples, restores the resting radius and stops listening on destroy', () => {
    const { trigger, layer } = mount();
    controller = createStateLayerController({ trigger, layer });
    controller.updateShape(shape);
    trigger.dispatchEvent(pointer('pointerdown'));
    expect(ripplesOf(layer)).toHaveLength(1);

    controller.destroy();
    controller = undefined;

    expect(ripplesOf(layer)).toHaveLength(0);
    expect(trigger.style.borderRadius).toBe('40px');
    expect(trigger.getAnimations()).toHaveLength(0);
    trigger.dispatchEvent(pointer('pointerup'));
    trigger.dispatchEvent(pointer('pointerdown'));
    expect(ripplesOf(layer)).toHaveLength(0);
  });

  it('resolves the outermost element carrying the named interaction group', () => {
    document.body.innerHTML = `
      <div class="group/button">
        <div class="group/button"><span id="layer"></span></div>
      </div>
    `;
    const layer = document.querySelector<HTMLElement>('#layer')!;

    expect(findStateLayerTrigger(layer, 'state-ripple-group-[button]')).toBe(
      document.body.firstElementChild,
    );
  });
});
