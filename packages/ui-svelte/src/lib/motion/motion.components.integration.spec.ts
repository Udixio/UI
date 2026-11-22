/**
 * TRIAL (review 5, Q3): `{@attach motion(...)}` on a Udixio component, with no wrapper. A Svelte component that spreads its
 * rest props on its root element hands the attachment to that element.
 */
import { afterEach, describe, expect, it } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import { getMotion } from '@udixio/motion';
import '@udixio/motion/presets';
import Fixture from './motion.components.fixture.svelte';

describe('motion attachment on Udixio components (trial)', () => {
  afterEach(() => cleanup());

  it('binds a press on Button: the attachment reaches its <button>', () => {
    render(Fixture);
    flushSync();
    expect(getMotion(screen.getByRole('button', { name: 'Save' }), 'emphasis')?.verb).toBe('emphasize');
  });

  it('follows the root when Button renders a link: the attachment runs on the new element', async () => {
    const { rerender } = render(Fixture);
    flushSync();
    await rerender({ href: '/docs' });
    flushSync();
    expect(getMotion(screen.getByRole('link', { name: 'Save' }), 'emphasis')).toBeDefined();
  });

  it('binds an appear on Card: its root takes the presence', () => {
    render(Fixture);
    flushSync();
    const card = screen.getByTestId('card');
    expect(getMotion(card, 'presence')).toBeDefined();
    expect(card).toHaveAttribute('data-motion-presence');
  });

  it('binds a shake on TextField: its root once, and not its input', () => {
    render(Fixture);
    flushSync();
    const input = screen.getByRole('textbox');
    const root = input.closest('fieldset')!.parentElement!;
    expect(getMotion(root, 'emphasis')?.verb).toBe('emphasize');
    expect(getMotion(input, 'emphasis')).toBeUndefined();
  });
});
