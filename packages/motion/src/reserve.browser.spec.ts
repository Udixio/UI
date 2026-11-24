/**
 * Step B (review 5, Q3): a component protects its own animations through the per-kind slot. `reserveMotion` occupies a kind of
 * an element for a component, which is not a named motion: a motion of that kind bound there is ignored, development names the
 * owner, and `getMotion`, `getMotions` and `inspect` show the slot. Step E: an element with `data-motion-box="none"` has no box
 * to give. The residual case, two kinds animating one property at once, is reported in development only.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getMotion, getMotions, motion, motionsWhenDefined, type DeferredMotion, type MotionBinding } from './bind.js';
import { animateStyle } from './animate.js';
import { connectMotion } from './connect.js';
import { defineMotion } from './define-motion.js';
import { fade, press } from './presets.js';
import { reserveMotion } from './slots.js';
import { inspect, revert } from './scope-entry.js';

defineMotion('reserve-fade', fade.spec);
/** An emphasis that animates the opacity: another kind than the presence a component holds, on the same property. */
defineMotion('reserve-pulse', { verb: 'emphasize', keyframes: [{ opacity: 1 }, { opacity: 0.4 }, { opacity: 1 }], timing: { duration: 400, easing: 'linear' } });
const tick = () => Promise.resolve();

let root: HTMLElement;
let panel: HTMLElement;
let bindings: MotionBinding[];
let deferreds: DeferredMotion[];
let releases: Array<() => void>;

beforeEach(() => {
  root = document.createElement('div');
  panel = document.createElement('div');
  panel.textContent = 'Saved';
  root.append(panel);
  document.body.append(root);
  bindings = [];
  deferreds = [];
  releases = [];
});

afterEach(() => {
  for (const release of releases) release();
  for (const each of deferreds) each.destroy();
  for (const each of bindings) each.destroy();
  root.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function reserve(...args: Parameters<typeof reserveMotion>): () => void {
  const release = reserveMotion(...args);
  releases.push(release);
  return release;
}

/** The messages of a console spy, as strings. */
const messages = (spy: { mock: { calls: unknown[][] } }): string[] => spy.mock.calls.map(call => String(call[0]));

describe('reserveMotion', () => {
  it('shows the reserved kind in getMotion and getMotions: its owner, its kind, and no verb', () => {
    reserve(panel, 'presence', 'Snackbar');
    const slot = getMotion(panel, 'presence');
    expect(slot).toBeDefined();
    expect(slot?.owner).toBe('Snackbar');
    expect(slot?.kind).toBe('presence');
    expect(slot?.verb).toBeNull();
    expect(getMotions(panel)).toEqual([slot]);
    expect(getMotion(panel, 'emphasis')).toBeUndefined();
  });

  it('reserves several kinds in one call, and one release frees them all', () => {
    const release = reserve(panel, ['presence', 'layout'], 'SideSheet');
    expect(getMotions(panel).map(each => [each.kind, each.owner])).toEqual([['presence', 'SideSheet'], ['layout', 'SideSheet']]);
    release();
    expect(getMotions(panel)).toEqual([]);
  });

  it('ignores a motion of the reserved kind: nothing is written, and development names the owner once', () => {
    reserve(panel, 'presence', 'Snackbar');
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const binding = motion(panel, 'reserve-fade', { present: false, development: true });
    bindings.push(binding);
    expect(binding.kind).toBe('presence');
    expect(binding.verb).toBe('appear');
    expect(panel.hasAttribute('data-motion-presence')).toBe(false);
    expect(panel.hasAttribute('inert')).toBe(false);
    expect(panel.style.opacity).toBe('');
    expect(panel.getAnimations()).toHaveLength(0);
    expect(getMotion(panel, 'presence')?.owner).toBe('Snackbar');
    expect(messages(error)).toEqual([
      expect.stringContaining('"reserve-fade" ignored: Snackbar already holds a presence on this element'),
    ]);
    // Once per element.
    bindings.push(motion(panel, 'reserve-fade', { development: true }));
    expect(error).toHaveBeenCalledTimes(1);
  });

  it('an ignored motion is inert: setPresent resolves at once and touches nothing, destroy keeps the reservation', async () => {
    reserve(panel, 'presence', 'Snackbar');
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const binding = motion(panel, fade);
    await expect(binding.setPresent(false)).resolves.toBe('finished');
    expect(panel.hasAttribute('data-motion-presence')).toBe(false);
    expect(binding.play()).toBeUndefined();
    binding.destroy();
    expect(getMotion(panel, 'presence')?.owner).toBe('Snackbar');
  });

  it('keeps the other kinds free: an emphasis binds and plays on a reserved presence', () => {
    reserve(panel, 'presence', 'Snackbar');
    const binding = motion(panel, press);
    bindings.push(binding);
    expect(getMotion(panel, 'emphasis')).toBe(binding);
    expect(binding.play()?.duration).toBeGreaterThan(0);
  });

  it('ignores the motion of a host declared with no box whose box is reserved', () => {
    const host = document.createElement('span');
    host.setAttribute('data-motion-box', 'child');
    root.append(host);
    host.append(panel);
    reserve(panel, 'presence', 'Snackbar');
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    bindings.push(motion(host, 'reserve-fade', { present: false, development: true }));
    expect(host.hasAttribute('data-motion-presence')).toBe(false);
    expect(host.hasAttribute('inert')).toBe(false);
    expect(panel.style.opacity).toBe('');
    expect(messages(error)[0]).toContain('"reserve-fade" ignored: Snackbar already holds a presence on this element');
  });

  it('a list bound by an adapter keeps its other kinds: the reserved one is left inert', () => {
    reserve(panel, 'presence', 'Menu');
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const [presence, emphasis] = motionsWhenDefined(panel, ['reserve-fade', 'press'], { development: true });
    deferreds.push(presence, emphasis);
    expect(getMotion(panel, 'presence')?.owner).toBe('Menu');
    expect(getMotion(panel, 'emphasis')).toBe(emphasis.binding);
    expect(messages(error)[0]).toContain('"reserve-fade" ignored: Menu already holds a presence on this element');
  });

  it('development reports the ignored motion without the option, and production says nothing', () => {
    reserve(panel, 'presence', 'Snackbar');
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.stubGlobal('__MOTION_CHECKS__', false);
    bindings.push(motion(panel, 'reserve-fade'));
    expect(error).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
    bindings.push(motion(panel, 'reserve-fade'));
    expect(messages(error)[0]).toContain('Snackbar already holds a presence');
  });

  it('takes the kind from a motion bound before it: the binding is destroyed and reported, with its owner named', () => {
    const binding = motion(panel, 'reserve-fade', { present: false });
    bindings.push(binding);
    expect(panel.dataset.motionPresence).toBe('exiting');
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    reserve(panel, 'presence', 'Snackbar');
    expect(panel.hasAttribute('data-motion-presence')).toBe(false);
    expect(panel.hasAttribute('inert')).toBe(false);
    expect(panel.style.opacity).toBe('');
    expect(getMotion(panel, 'presence')?.owner).toBe('Snackbar');
    expect(messages(error)[0]).toContain('"reserve-fade" ignored: Snackbar already holds a presence on this element');
  });

  it('release frees the kind: a motion of that kind binds again', () => {
    const release = reserve(panel, 'presence', 'Snackbar');
    release();
    expect(getMotion(panel, 'presence')).toBeUndefined();
    const binding = motion(panel, fade, { present: false });
    bindings.push(binding);
    expect(getMotion(panel, 'presence')).toBe(binding);
    expect(panel.dataset.motionPresence).toBe('exiting');
    // A second release does not touch the motion bound since.
    release();
    expect(getMotion(panel, 'presence')).toBe(binding);
  });

  it('only its release frees the kind: destroy() on the slot and revert() leave it held', () => {
    reserve(panel, 'presence', 'Snackbar');
    getMotion(panel, 'presence')?.destroy();
    expect(getMotion(panel, 'presence')?.owner).toBe('Snackbar');
    revert(root);
    expect(getMotion(panel, 'presence')?.owner).toBe('Snackbar');
  });

  it('the slot is inert: its calls do nothing to the element', async () => {
    reserve(panel, 'presence', 'Snackbar');
    const slot = getMotion(panel, 'presence')!;
    expect(slot.handle).toBeNull();
    await expect(slot.setPresent(false)).resolves.toBe('finished');
    expect(slot.play()).toBeUndefined();
    expect(() => slot.pause()).not.toThrow();
    expect(panel.hasAttribute('data-motion-presence')).toBe(false);
  });

  it('inspect lists the reserved kind with its owner', () => {
    reserve(panel, 'presence', 'Snackbar');
    bindings.push(motion(panel, 'press'));
    const report = inspect(root);
    expect(report.bindings).toEqual([
      { element: expect.any(String), kind: 'presence', name: null, verb: null, owner: 'Snackbar', state: 'reserved' },
      { element: expect.any(String), kind: 'emphasis', name: 'press', verb: 'emphasize', state: 'idle' },
    ]);
    expect(JSON.parse(JSON.stringify(report))).toEqual(report);
  });

  it('the HTML scanner leaves a reserved kind to its owner', async () => {
    reserve(panel, 'presence', 'Snackbar');
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    panel.dataset.motion = 'reserve-fade press';
    const disconnect = connectMotion({ root });
    try {
      await tick();
      expect(getMotion(panel, 'presence')?.owner).toBe('Snackbar');
      expect(getMotion(panel, 'emphasis')?.verb).toBe('emphasize');
    } finally {
      disconnect();
      revert(root);
    }
  });
});

describe('data-motion-box="none"', () => {
  it('a host with no box to give binds nothing, and development points to the component’s own motion prop', () => {
    const host = document.createElement('span');
    host.setAttribute('data-motion-box', 'none');
    host.style.display = 'contents';
    host.append(panel);
    root.append(host);
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const binding = motion(host, 'reserve-fade', { present: false, development: true });
    bindings.push(binding);
    expect(binding.kind).toBe('presence');
    expect(host.hasAttribute('data-motion-presence')).toBe(false);
    expect(host.hasAttribute('inert')).toBe(false);
    expect(panel.style.opacity).toBe('');
    expect(getMotions(host)).toEqual([]);
    expect(getMotions(panel)).toEqual([]);
    expect(messages(error)).toEqual([expect.stringContaining('"reserve-fade" ignored: <span> has no box to give (data-motion-box="none")')]);
    expect(messages(error)[0]).toContain('motion prop');
  });

  it('a wrapper declared with no box whose child has no box to give binds nothing either', () => {
    const host = document.createElement('span');
    host.setAttribute('data-motion-box', 'child');
    const component = document.createElement('div');
    component.setAttribute('data-motion-box', 'none');
    component.style.display = 'contents';
    component.append(panel);
    host.append(component);
    root.append(host);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    bindings.push(motion(host, press));
    expect(getMotions(panel)).toEqual([]);
    expect(getMotions(component)).toEqual([]);
  });

  it('the HTML scanner binds nothing on it, and production says nothing', async () => {
    const host = document.createElement('div');
    host.setAttribute('data-motion-box', 'none');
    host.dataset.motion = 'reserve-fade';
    root.append(host);
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.stubGlobal('__MOTION_CHECKS__', false);
    const disconnect = connectMotion({ root });
    try {
      await tick();
      expect(getMotions(host)).toEqual([]);
      expect(error).not.toHaveBeenCalled();
    } finally {
      disconnect();
    }
  });
});

describe('two sources animating one property', () => {
  /** A named emphasis on the opacity, and a component that fades the same element: the residual case of two kinds. */
  function bothPlaying(order: 'component-first' | 'motion-first'): void {
    reserve(panel, 'presence', 'Snackbar');
    const binding = motion(panel, 'reserve-pulse');
    bindings.push(binding);
    const component = () => animateStyle(panel, { opacity: 0.5 }, { timing: { duration: 400, easing: 'linear' } });
    if (order === 'component-first') {
      component();
      binding.play();
    } else {
      binding.play();
      component();
    }
  }

  it('development warns once when a component and a named motion animate the same property at once', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    bothPlaying('component-first');
    expect(messages(warn)).toEqual([expect.stringContaining('opacity is animated by two sources: Snackbar and "reserve-pulse"')]);
    // Once per element.
    animateStyle(panel, { opacity: 1 }, { timing: { duration: 400, easing: 'linear' } });
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('warns whichever starts first', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    bothPlaying('motion-first');
    expect(messages(warn)).toEqual([expect.stringContaining('opacity is animated by two sources: Snackbar and "reserve-pulse"')]);
  });

  it('names animateStyle when the element is not reserved', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const binding = motion(panel, 'reserve-pulse');
    bindings.push(binding);
    binding.play();
    animateStyle(panel, { opacity: 0.5 }, { timing: { duration: 400, easing: 'linear' } });
    expect(messages(warn)[0]).toContain('opacity is animated by two sources: animateStyle and "reserve-pulse"');
  });

  it('says nothing for other properties, or for a motion that has ended', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    reserve(panel, 'presence', 'Snackbar');
    const binding = motion(panel, 'reserve-pulse');
    bindings.push(binding);
    const played = binding.play()!;
    animateStyle(panel, { height: '20px' }, { timing: { duration: 400, easing: 'linear' } });
    played.seek(played.delay + played.duration);
    await played.finished;
    animateStyle(panel, { opacity: 0.5 }, { timing: { duration: 400, easing: 'linear' } });
    expect(warn).not.toHaveBeenCalled();
  });

  it('production does no check: no warning, whichever starts first', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.stubGlobal('__MOTION_CHECKS__', false);
    bothPlaying('component-first');
    bothPlaying('motion-first');
    expect(warn).not.toHaveBeenCalled();
  });
});
