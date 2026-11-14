import { expect, it } from 'vitest';
import { startRoutedMotion } from './timing-integration.js';
import { waapiProvider } from './providers/waapi.js';
import { probeWaapiEasing } from './waapi-probe.js';

it('runs a scenario-specific curve in the target iframe while preserving existing effects', async () => {
  const iframe = document.createElement('iframe');
  document.body.append(iframe);
  const doc = iframe.contentDocument!;
  const target = doc.createElement('div');
  doc.body.append(target);
  const existing = target.animate([{ opacity: 1 }, { opacity: 1 }], { duration: 10000 });
  const baseline = waapiProvider.activeCount();
  const input = { target, keyframes: [{ opacity: 0 }, { opacity: 1 }] as { opacity: number }[], timing: { duration: 'duration.medium1', easing: 'easing.standard' }, scheme: 'standard', verb: 'appear', policy: 'normal', scale: 1, backend: 'waapi' } as const;
  try {
    const before = target.getAnimations();
    const result = startRoutedMotion(input, waapiProvider, (element, candidate) => {
      expect(element).toBe(target);
      expect(element.ownerDocument.defaultView).toBe(iframe.contentWindow);
      expect(candidate.backend).toBe('waapi');
      return 'supported'; // Limited to this explicit curve and scenario.
    });
    expect(result.status).toBe('started');
    if (result.status !== 'started') return;
    expect(result.handle.backend).toBe('waapi');
    expect(result.handle.duration).toBe(result.route.duration);
    expect(waapiProvider.activeCount()).toBe(baseline + 1);
    expect(target.getAnimations()).toHaveLength(before.length + 1);
    result.handle.pause();
    result.handle.seek(result.handle.duration / 2);
    await new Promise(requestAnimationFrame);
    const opacity = Number(iframe.contentWindow!.getComputedStyle(target).opacity);
    expect(opacity).toBeGreaterThan(0);
    expect(opacity).toBeLessThan(1);
    result.handle.seek(result.handle.duration);
    result.handle.play();
    expect(await result.handle.finished).toBe('finished');
    expect(waapiProvider.activeCount()).toBe(baseline);
    expect(target.getAnimations()).toEqual(before);
    expect(target.getAnimations()).toContain(existing);
    expect(Number(iframe.contentWindow!.getComputedStyle(target).opacity)).toBeCloseTo(1);
    const second = startRoutedMotion(input, waapiProvider, () => 'supported');
    if (second.status !== 'started') throw Error('not started');
    second.handle.cancel(); second.handle.cancel();
    expect(await second.handle.finished).toBe('cancelled');
    expect(waapiProvider.activeCount()).toBe(baseline);
    const beforeReduced = target.getAnimations().length;
    const style = target.getAttribute('style');
    expect(startRoutedMotion({ ...input, policy: 'reduced' }, waapiProvider, () => { throw Error('unexpected'); }).status).toBe('reduced');
    expect(target.getAnimations()).toHaveLength(beforeReduced);
    expect(target.getAttribute('style')).toBe(style);
    const syntax = startRoutedMotion(input, waapiProvider, (el, candidate) => probeWaapiEasing(el, candidate.easing).status === 'refused' ? 'refused' : 'unknown');
    expect(syntax.status).toBe('unavailable');
    const original = target.animate;
    target.animate = () => { throw Error('creation failed'); };
    try { expect(() => startRoutedMotion(input, waapiProvider, () => 'supported')).toThrow('creation failed'); }
    finally { target.animate = original; }
    expect(waapiProvider.activeCount()).toBe(baseline);
  } finally { existing.cancel(); iframe.remove(); }
});
