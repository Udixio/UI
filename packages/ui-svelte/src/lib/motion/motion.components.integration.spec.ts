/**
 * `{@attach motion(...)}` on a Udixio component, with no wrapper. A Svelte component that spreads its
 * rest props on its root element hands the attachment to that element.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import { getMotion } from '@udixio/motion';
import '@udixio/motion/presets';
import Fixture from './motion.components.fixture.svelte';
import HostFixture from './motion.host.fixture.svelte';

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

  it('binds an appear on Card: its root takes the presence (the root is the element the attachment is on)', () => {
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

describe('present on a Card and on a host declared with no box (step C)', () => {
  let sheet: HTMLStyleElement;
  beforeEach(() => {
    // jsdom has no Tailwind: the rule the class compiles to.
    sheet = document.createElement('style');
    sheet.textContent = '.\\[\\&\\:not\\(\\[hidden\\]\\)\\]\\:contents:not([hidden]) { display: contents; }';
    document.head.append(sheet);
  });
  afterEach(() => {
    sheet.remove();
    cleanup();
  });

  it('a Card absent from the first render is hidden on its root, which carries the state and the pixels', () => {
    render(HostFixture, { open: false });
    flushSync();
    const card = screen.getByTestId('card');
    expect(card.hidden).toBe(true);
    expect(card).toHaveAttribute('data-motion-presence', 'exiting');
    expect(getComputedStyle(card).display).toBe('none');
  });

  it('a declared host carries hidden, the presence mark and inert, and its Card root takes the motion; hidden hides the host', async () => {
    const { rerender } = render(HostFixture, { open: true });
    flushSync();
    const host = screen.getByTestId('host');
    const boxed = screen.getByTestId('boxed');
    expect(getMotion(host, 'presence')).toBe(getMotion(boxed, 'presence'));
    expect(getComputedStyle(host).display).toBe('contents');

    await rerender({ open: false });
    flushSync();
    expect(host.hidden).toBe(true);
    expect(host).toHaveAttribute('data-motion-presence', 'exiting');
    expect(host).toHaveAttribute('inert');
    expect(boxed.hidden).toBe(false);
    expect(boxed).not.toHaveAttribute('data-motion-presence');
    expect(boxed).not.toHaveAttribute('inert');
    await vi.waitFor(() => expect(getComputedStyle(host).display).toBe('none'));

    await rerender({ open: true });
    flushSync();
    expect(host.hidden).toBe(false);
    expect(host).not.toHaveAttribute('inert');
    expect(getComputedStyle(host).display).toBe('contents');
    expect(boxed).not.toHaveAttribute('data-motion-presence');
  });

  it('a declared host absent from the first render is not displayed, and its Card root is not hidden', () => {
    render(HostFixture, { open: false });
    flushSync();
    const host = screen.getByTestId('host');
    expect(host.hidden).toBe(true);
    expect(getComputedStyle(host).display).toBe('none');
    expect(screen.getByTestId('boxed').hidden).toBe(false);
    expect(host).toHaveAttribute('data-motion-presence', 'exiting');
  });
});
