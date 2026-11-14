import { expect, it } from 'vitest';

async function loadMotionStylesheet(href = '/motion.css') {
  const style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = href;
  await new Promise<void>((resolve, reject) => {
    const fail = () => {
      clearTimeout(timer);
      style.remove();
      reject(new Error('stylesheet failed to load'));
    };
    const timer = setTimeout(fail, 4000);
    style.onload = () => { clearTimeout(timer); resolve(); };
    style.onerror = fail;
    document.head.append(style);
  });
  return style;
}

it('removes the stylesheet when loading fails', async () => {
  const href = '/missing-motion-test.css';
  await expect(loadMotionStylesheet(href)).rejects.toThrow('stylesheet failed to load');
  expect(document.querySelector(`link[href="${href}"]`)).toBeNull();
});

it('registers an inherited scale at the document level', async () => {
  const style = await loadMotionStylesheet();
  const host = document.createElement('div');
  host.style.setProperty('--udx-motion-scale', 'calc(0.25 + 0.25)');
  const child = document.createElement('div');
  const shadowChild = document.createElement('div');
  host.append(child);
  host.attachShadow({ mode: 'open' }).append(document.createElement('slot'), shadowChild);
  document.body.append(host);
  try {
    const expectedScale = matchMedia('(prefers-reduced-motion: reduce)').matches ? '0' : '1';
    expect(getComputedStyle(document.documentElement).getPropertyValue('--udx-motion-scale').trim()).toBe(expectedScale);
    expect(getComputedStyle(child).getPropertyValue('--udx-motion-scale').trim()).toBe('0.5');
    expect(getComputedStyle(shadowChild).getPropertyValue('--udx-motion-scale').trim()).toBe('0.5');
    const media = Array.from(style.sheet!.cssRules).find(rule => rule instanceof CSSMediaRule && rule.conditionText.includes('prefers-reduced-motion')) as CSSMediaRule;
    expect(media).toBeDefined();
    expect(media.cssText).toContain('--udx-motion-scale: 0');
  } finally { host.remove(); style.remove(); }
});

it('exposes provisional token values to the document and inherited descendants', async () => {
  const { defineTokens } = await import('./index.js');
  const style = await loadMotionStylesheet();
  const child = document.createElement('div');
  document.body.append(child);
  try {
    const tokens = defineTokens();
    const computed = getComputedStyle(child);
    for (const [name, value] of Object.entries(tokens.distance)) {
      expect(computed.getPropertyValue(`--udx-motion-distance-${name}`).trim()).toBe(`${value}px`);
    }
    for (const [name, value] of Object.entries(tokens.stagger)) {
      expect(computed.getPropertyValue(`--udx-motion-stagger-${name}`).trim()).toBe(`${value / 1000}s`);
    }
  } finally { child.remove(); style.remove(); }
});

it('registers each distance and stagger as an inherited typed property', async () => {
  const style = await loadMotionStylesheet();
  const host = document.createElement('div');
  const child = document.createElement('div');
  host.append(child);
  document.body.append(host);
  try {
    for (const [name, valid] of [
      ...['sm', 'md', 'lg'].map(name => [`--udx-motion-distance-${name}`, '12px']),
      ...['tight', 'normal', 'loose', 'max'].map(name => [`--udx-motion-stagger-${name}`, '75ms']),
    ]) {
      host.style.setProperty(name, valid);
      child.style.setProperty(name, 'invalid');
      expect(getComputedStyle(child).getPropertyValue(name).trim(), name).toBe(valid === '75ms' ? '0.075s' : valid);
    }
  } finally { host.remove(); style.remove(); }
});
