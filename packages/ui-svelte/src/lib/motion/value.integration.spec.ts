import { afterEach, describe, expect, it } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import { defineValue } from '@udixio/motion/value';
import { getMotionValue } from './value.attachment.svelte';
import Fixture from './value.fixture.svelte';

defineValue('tilt-test', { source: 'state', timing: 'none' });

describe('motion value attachment with the real core', () => {
  afterEach(() => {
    cleanup();
  });

  it('writes a state value as the CSS variable of the element, and reports it to onChange', () => {
    const calls: number[] = [];
    render(Fixture, {
      props: { source: 'tilt-test', onChange: (next: number) => calls.push(next) },
    });
    flushSync();
    const box = screen.getByTestId('box');

    getMotionValue(box, 'tilt-test')?.set(0.5);

    expect(box.style.getPropertyValue('--udx-motion-value-tilt-test')).toBe('0.5');
    expect(calls).toEqual([0.5]);
  });
});
