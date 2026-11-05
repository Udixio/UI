import { expect, it } from 'vitest';

it('registers an inherited scale at the document level', async () => {
  const response = await fetch('/motion.css');
  expect(response.ok).toBe(true);
  const css = await response.text();
  const style = document.createElement('style');
  style.textContent = css;
  document.head.append(style);
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
  const response = await fetch('/motion.css');
  expect(response.ok).toBe(true);
  const style = document.createElement('style');
  style.textContent = await response.text();
  document.head.append(style);
  const child = document.createElement('div');
  document.body.append(child);
  try {
    const tokens = defineTokens();
    const computed = getComputedStyle(child);
    for (const [name, value] of Object.entries(tokens.distance)) {
      expect(computed.getPropertyValue(`--udx-motion-distance-${name}`).trim()).toBe(`${value}px`);
    }
    for (const [name, value] of Object.entries(tokens.stagger)) {
      expect(computed.getPropertyValue(`--udx-motion-stagger-${name}`).trim()).toBe(`${value}ms`);
    }
  } finally { child.remove(); style.remove(); }
});
