import { afterEach, describe, expect, it } from 'vitest';
import { NEUTRAL_AXIS_BASE, readAxisBase } from './axis-base.js';

describe('readAxisBase', () => {
  let element: HTMLElement | undefined;

  afterEach(() => {
    element?.remove();
    element = undefined;
  });

  /** A fresh element, in the document, with the given inline style. */
  function mount(style = ''): HTMLElement {
    element = document.createElement('div');
    element.setAttribute('style', style);
    document.body.append(element);
    return element;
  }

  it('keeps percentages of the computed translate', () => {
    expect(readAxisBase(mount('translate: -50% 0px')).x).toBe('-50%');
  });

  it('reads the neutral base of an element with no transform', () => {
    expect(readAxisBase(mount())).toEqual(NEUTRAL_AXIS_BASE);
  });

  it('keeps a calc() translate as the browser computes it', () => {
    expect(readAxisBase(mount('translate: calc(50% + 4px) 0px')).x).toMatch(
      /^calc\(\s*50%\s*\+\s*4px\s*\)$/,
    );
  });
});
