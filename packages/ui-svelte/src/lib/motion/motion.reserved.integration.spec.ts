/**
 * Steps B and E (review 5, Q3). B: a component that animates its own element holds that kind there (`reserveMotion`, in its
 * shared controller), so the `motion` attachment of that kind on it is ignored, and development names the component. E: a
 * component whose root has no box to give (a ContextMenu: its trigger is the author's, its menu is in the top layer) marks its
 * root `data-motion-box="none"`: the attachment, which reaches that root, binds nothing. A SideSheet and an AnchorPositioner
 * take the attachment on their own surface, even in a portal: it is their box.
 */
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { flushSync, tick } from 'svelte';
import { getMotion, getMotions, motion } from '@udixio/motion';
import '@udixio/motion/presets';
import Fixture from './motion.reserved.fixture.svelte';

/** The development messages of a console spy that contain `text`. */
const reported = (spy: MockInstance, text: string): string[] =>
  spy.mock.calls.map(([message]) => String(message)).filter((message) => message.includes(text));

let error: MockInstance;
beforeEach(() => {
  error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('a Udixio component holds the kinds it animates (step B)', () => {
  it('Snackbar: a presence on it is ignored and development names Snackbar; an emphasis binds', () => {
    render(Fixture);
    flushSync();
    const panel = screen.getByTestId('snackbar');
    expect(getMotion(panel, 'presence')?.owner).toBe('Snackbar');
    expect(getMotion(panel, 'emphasis')?.verb).toBe('emphasize');
    expect(panel).not.toHaveAttribute('data-motion-presence');
    expect(reported(error, '"fade" ignored: Snackbar already holds a presence on this element')).toHaveLength(1);
  });

  it('SideSheet: a presence on its panel is ignored, and development names SideSheet', () => {
    render(Fixture);
    flushSync();
    const panel = screen.getByTestId('sheet');
    expect(getMotion(panel, 'presence')?.owner).toBe('SideSheet');
    expect(getMotion(panel, 'layout')?.owner).toBe('SideSheet');
    expect(panel).not.toHaveAttribute('data-motion-presence');
    expect(reported(error, '"fade" ignored: SideSheet already holds a presence on this element')).toHaveLength(1);
  });

  it('Menu: the surface of an open ContextMenu holds its presence, and a presence bound on it is ignored', async () => {
    render(Fixture);
    flushSync();
    await fireEvent.contextMenu(screen.getByRole('button', { name: 'Document' }), { clientX: 10, clientY: 10 });
    await tick();
    flushSync();
    const menu = await screen.findByRole('menu');
    expect(getMotion(menu, 'presence')?.owner).toBe('Menu');
    const binding = motion(menu, 'fade', { present: false });
    expect(menu).not.toHaveAttribute('data-motion-presence');
    expect(reported(error, '"fade" ignored: Menu already holds a presence on this element')).toHaveLength(1);
    binding.destroy();
  });
});

describe('a Udixio component with no box to give (step E)', () => {
  it('ContextMenu: its root is marked none, the attachment binds nothing there nor on the trigger, and development says so', () => {
    render(Fixture);
    flushSync();
    const root = screen.getByTestId('context');
    expect(root).toHaveAttribute('data-motion-box', 'none');
    expect(getMotions(root)).toEqual([]);
    expect(getMotions(screen.getByRole('button', { name: 'Document' }))).toEqual([]);
    const [message] = reported(error, '"press" ignored:');
    expect(message).toContain('has no box to give (data-motion-box="none")');
    expect(message).toContain('motion prop');
  });
});
