import { expect, it } from 'vitest';
import { defineTokens } from './tokens.js';
const milliseconds = (value: string) => value.endsWith('ms') ? parseFloat(value) : parseFloat(value) * 1000;

it('exposes inherited initial curve values and accepts local overrides in both schemes', async () => {
  expect(getComputedStyle(document.documentElement).getPropertyValue('--udx-motion-spring-fast-spatial-duration').trim()).toBe('');
  expect(getComputedStyle(document.documentElement).getPropertyValue('--udx-motion-duration-medium2').trim()).toBe('');
  const style = document.createElement('link');
  style.rel = 'stylesheet'; style.href = '/motion.css';
  await new Promise<void>((resolve, reject) => { style.onload = () => resolve(); style.onerror = () => reject(new Error('stylesheet failed')); document.head.append(style); });
  const element = document.createElement('div');
  document.body.append(element);
  try {
    for (const scheme of ['expressive', 'standard'] as const) {
      document.documentElement.dataset.motionScheme = scheme;
      const tokens = defineTokens({ scheme });
      const cssName = (name: string) => name.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
      for (const [name, value] of Object.entries(tokens.duration)) {
        expect(milliseconds(getComputedStyle(element).getPropertyValue(`--udx-motion-duration-${cssName(name)}`).trim())).toBe(value);
      }
      for (const [name, value] of Object.entries(tokens.easing)) {
        expect(getComputedStyle(element).getPropertyValue(`--udx-motion-easing-${cssName(name)}`).trim()).toBe(value);
      }
      expect(getComputedStyle(element).getPropertyValue('--udx-motion-spring-fast-spatial-duration').trim()).toBe(`${tokens.spring.fast.spatial[CSS.supports('animation-timing-function', 'linear(0, 1)') ? 'linear' : 'fallback'].duration}ms`);
      expect(milliseconds(getComputedStyle(element).getPropertyValue('--udx-motion-duration-medium2').trim())).toBe(tokens.duration.medium2);
      expect(getComputedStyle(element).getPropertyValue('--udx-motion-easing-standard').trim()).toBe(tokens.easing.standard);
      element.style.setProperty('--udx-motion-duration-medium2', '125ms');
      expect(milliseconds(getComputedStyle(element).getPropertyValue('--udx-motion-duration-medium2').trim())).toBe(125);
      element.style.removeProperty('--udx-motion-duration-medium2');
    }
  } finally { delete document.documentElement.dataset.motionScheme; element.remove(); style.remove(); }
});

it('runs a transition with the token duration scaled once', async () => {
  const style = document.createElement('link');
  style.rel = 'stylesheet'; style.href = '/motion.css';
  await new Promise<void>((resolve, reject) => { style.onload = () => resolve(); style.onerror = () => reject(new Error('stylesheet failed')); document.head.append(style); });
  const element = document.createElement('div');
  element.style.cssText = 'opacity: 0; --udx-motion-scale: 0.5; transition-property: opacity; transition-duration: calc(var(--udx-motion-duration-medium2) * var(--udx-motion-scale)); transition-timing-function: var(--udx-motion-easing-standard)';
  document.body.append(element);
  try {
    expect(milliseconds(getComputedStyle(element).transitionDuration)).toBe(150);
    const ended = new Promise<TransitionEvent>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('transition did not finish')), 3000);
      element.addEventListener('transitionend', event => { clearTimeout(timer); resolve(event); }, { once: true });
    });
    element.style.opacity = '1';
    const event = await ended;
    expect(event.propertyName).toBe('opacity');
    expect(event.elapsedTime).toBeCloseTo(0.15, 2);
    expect(getComputedStyle(element).opacity).toBe('1');
  } finally { element.remove(); style.remove(); }
});
