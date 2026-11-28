import { afterEach, describe, expect, it } from 'vitest';
import { readAxisBase } from './axis-base.js';

describe('readAxisBase', () => {
  let element: HTMLElement | undefined;

  afterEach(() => {
    element?.remove();
    element = undefined;
  });

  it('keeps percentages of the computed translate', () => {
    element = document.createElement('div');
    element.style.setProperty('translate', '-50% 0px');
    document.body.append(element);
    expect(readAxisBase(element).x).toBe('-50%');
  });
});
