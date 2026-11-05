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
    expect(getComputedStyle(child).getPropertyValue('--udx-motion-scale').trim()).toBe('0.5');
    expect(getComputedStyle(shadowChild).getPropertyValue('--udx-motion-scale').trim()).toBe('0.5');
    const media = Array.from(style.sheet!.cssRules).find(rule => rule instanceof CSSMediaRule && rule.conditionText.includes('prefers-reduced-motion')) as CSSMediaRule;
    expect(media).toBeDefined();
    expect(media.cssText).toContain('--udx-motion-scale: 0');
  } finally { host.remove(); style.remove(); }
});
