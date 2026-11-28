import { afterEach, describe, expect, it } from 'vitest';
import { readAxisBase } from './axis-base.js';
import {
  channelsOf,
  toWaapiKeyframes,
  type StyleKeyframe,
} from './keyframes.js';

describe('toWaapiKeyframes in the browser', () => {
  let element: HTMLElement | undefined;

  afterEach(() => {
    element?.remove();
    element = undefined;
  });

  /** Plays the frames on a fresh element with the given inline style, and reads the property once the motion has ended. */
  async function playToEnd(
    style: string,
    frames: StyleKeyframe[],
    property: string,
  ): Promise<string> {
    element = document.createElement('div');
    element.setAttribute('style', style);
    document.body.append(element);
    // The base is read from the element, as a claim does when it starts.
    const base = readAxisBase(element);
    const animation = element.animate(
      toWaapiKeyframes(frames, channelsOf(frames), base),
      {
        duration: 50,
        fill: 'forwards',
      },
    );
    await animation.finished;
    return getComputedStyle(element).getPropertyValue(property);
  }

  it('animates a kebab-case background-color to its end value', async () => {
    const end = await playToEnd(
      'background-color: rgb(255, 0, 0)',
      [
        { 'background-color': 'rgb(255, 0, 0)' },
        { 'background-color': 'rgb(0, 0, 255)' },
      ],
      'background-color',
    );
    expect(end).toBe('rgb(0, 0, 255)');
  });

  it('animates a camelCase borderRadius to its end value', async () => {
    const end = await playToEnd(
      'border-top-left-radius: 0px',
      [{ borderRadius: '0px' }, { borderRadius: '20px' }],
      'border-top-left-radius',
    );
    expect(end).toBe('20px');
  });

  it('keeps the percentage of the axis a motion does not name', async () => {
    const end = await playToEnd(
      'translate: -50% 0px',
      [{ y: 0 }, { y: 24 }],
      'translate',
    );
    expect(end).toBe('-50% 24px');
  });
});
