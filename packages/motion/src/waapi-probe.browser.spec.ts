import { expect, it } from 'vitest';
import { probeWaapiEasing } from './waapi-probe.js';
import { springData } from './spring-data.generated.js';

it('probes the iframe realm without altering existing CSS or WAAPI animations', () => {
  const iframe = document.createElement('iframe');
  document.body.append(iframe);
  try {
    const doc = iframe.contentDocument!;
    const view = iframe.contentWindow! as Window & typeof globalThis;
    expect(view.KeyframeEffect).not.toBe(window.KeyframeEffect);
    const style = doc.createElement('style');
    style.textContent = '@keyframes probe-existing { from { opacity: .2 } to { opacity: .8 } } .animated { animation: probe-existing 100s linear infinite; }';
    doc.head.append(style);
    const target = doc.createElement('div');
    target.className = 'animated';
    doc.body.append(target);
    const waapi = target.animate([{ transform: 'translateX(0px)' }, { transform: 'translateX(10px)' }], { duration: 100000 });
    const before = doc.getAnimations();
    expect(before).toHaveLength(2);
    expect(before.some((a) => a instanceof view.CSSAnimation)).toBe(true);
    before.forEach((animation) => animation.pause());
    const states = before.map((animation) => ({ animation, playState: animation.playState, currentTime: animation.currentTime, effect: animation.effect }));
    const markup = doc.documentElement.outerHTML;
    for (const easing of [springData.effects[0].linear.easing, 'cubic-bezier(0.2, 0, 0, 1)', 'linear']) {
      expect(probeWaapiEasing(target, easing).status).toBe('accepted');
    }
    for (const easing of ['bogus', 'linear(0, nope)', 'cubic-bezier(2, 0, 0, 1)']) {
      expect(probeWaapiEasing(target, easing).status).toBe('refused');
    }
    expect(doc.documentElement.outerHTML).toBe(markup);
    expect(new Set(doc.getAnimations())).toEqual(new Set(before));
    for (const state of states) {
      expect(state.animation.playState).toBe(state.playState);
      expect(state.animation.currentTime).toBe(state.currentTime);
      expect(state.animation.effect).toBe(state.effect);
    }
    waapi.cancel();
  } finally {
    iframe.remove();
  }
});
