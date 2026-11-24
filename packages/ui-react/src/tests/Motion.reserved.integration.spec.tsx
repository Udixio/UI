/**
 * Steps B and E (review 5, Q3). B: a component that animates its own element holds that kind there (`reserveMotion`, in its
 * shared controller), so a motion of that kind on it is ignored, and development names the component. E: a component whose
 * surface is in a portal or the top layer declares it has no box to give (`X[MOTION_BOX] = 'none'`): `<Motion as={X}>`
 * renders its wrapper with `data-motion-box="none"`, nothing binds, and development points to the component's motion prop.
 */
import '@udixio/motion/presets';
import { act } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getMotion, getMotions, MOTION_BOX, motion } from '@udixio/motion';
import {
  AnchorPositioner,
  Button,
  ContextMenu,
  MenuItem,
  Motion,
  SideSheet,
  Snackbar,
  Tooltip,
} from '../lib/index.js';

afterEach(() => {
  vi.restoreAllMocks();
});

/** The development messages of a console spy that contain `text`. */
const reported = (spy: { mock: { calls: unknown[][] } }, text: string): string[] =>
  spy.mock.calls.map(([message]) => String(message)).filter((message) => message.includes(text));

describe('a component holds the kinds it animates (step B)', () => {
  it('Snackbar: a presence on it is ignored, the wrapper carries no presence, and development names Snackbar once', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { container } = render(<Motion as={Snackbar} name="fade" message="Saved" />);
    await act(async () => {});
    const host = container.firstElementChild as HTMLElement;
    const panel = host.firstElementChild as HTMLElement;
    expect(getMotion(panel, 'presence')?.owner).toBe('Snackbar');
    expect(host.hasAttribute('data-motion-presence')).toBe(false);
    expect(host.hasAttribute('inert')).toBe(false);
    expect(reported(error, '"fade" ignored: Snackbar already holds a presence on this element')).toHaveLength(1);
  });

  it('Snackbar: another kind still binds, an emphasis on its panel', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { container } = render(<Motion as={Snackbar} name="fade press" message="Saved" />);
    await act(async () => {});
    const panel = container.firstElementChild!.firstElementChild!;
    expect(getMotion(panel, 'emphasis')?.verb).toBe('emphasize');
  });

  it('SideSheet (standard): a presence on its panel is ignored, and development names SideSheet', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { container } = render(
      <Motion as={SideSheet} name="fade" title="Filters">
        Body
      </Motion>,
    );
    await act(async () => {});
    const host = container.firstElementChild as HTMLElement;
    expect(host.getAttribute('data-motion-box')).toBe('child');
    const panel = host.firstElementChild as HTMLElement;
    expect(getMotion(panel, 'presence')?.owner).toBe('SideSheet');
    expect(getMotion(panel, 'layout')?.owner).toBe('SideSheet');
    expect(host.hasAttribute('data-motion-presence')).toBe(false);
    expect(reported(error, 'SideSheet already holds a presence on this element')).toHaveLength(1);
  });

  it('Menu: the surface of an open ContextMenu holds its presence, and a presence bound on it is ignored', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(
      <ContextMenu accessibleLabel="Document actions" trigger={<button type="button">Document</button>}>
        <MenuItem label="Rename" />
      </ContextMenu>,
    );
    fireEvent.contextMenu(screen.getByRole('button', { name: 'Document' }), { clientX: 10, clientY: 10 });
    const menu = await screen.findByRole('menu');
    expect(getMotion(menu, 'presence')?.owner).toBe('Menu');
    const binding = motion(menu, 'fade', { present: false });
    expect(menu.hasAttribute('data-motion-presence')).toBe(false);
    expect(reported(error, '"fade" ignored: Menu already holds a presence on this element')).toHaveLength(1);
    binding.destroy();
  });
});

describe('a component with no box to give (step E)', () => {
  it('declares it with a static under MOTION_BOX, which is Symbol.for("udixio.motion.box")', () => {
    expect(MOTION_BOX).toBe(Symbol.for('udixio.motion.box'));
    expect((Tooltip as unknown as Record<symbol, unknown>)[MOTION_BOX]).toBe('none');
    expect((AnchorPositioner as unknown as Record<symbol, unknown>)[MOTION_BOX]).toBe('none');
    expect((ContextMenu as unknown as Record<symbol, unknown>)[MOTION_BOX]).toBe('none');
  });

  it('Tooltip: the wrapper is marked none, its anchor does not move, and development points to the motion prop', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { container } = render(
      <Motion as={Tooltip} name="fade" text="Copy to clipboard">
        <Button label="Copy" />
      </Motion>,
    );
    await act(async () => {});
    const host = container.firstElementChild as HTMLElement;
    expect(host.getAttribute('data-motion-box')).toBe('none');
    expect(host.style.display).toBe('contents');
    const anchor = screen.getByRole('button', { name: 'Copy' });
    expect(getMotions(anchor)).toEqual([]);
    expect(getMotions(host)).toEqual([]);
    expect(host.hasAttribute('data-motion-presence')).toBe(false);
    const [message] = reported(error, '"fade" ignored:');
    expect(message).toContain('has no box to give (data-motion-box="none")');
    expect(message).toContain('motion prop');
  });

  it('a component with no box to give is never hidden by present: its anchor stays shown', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { container } = render(
      <Motion as={Tooltip} name="fade" present={false} text="Copy to clipboard">
        <Button label="Copy" />
      </Motion>,
    );
    await act(async () => {});
    const host = container.firstElementChild as HTMLElement;
    expect(host.hidden).toBe(false);
    expect(host.style.display).toBe('contents');
  });

  it('SideSheet: none when it is modal, a box of its own when it is standard', () => {
    const modal = renderToString(
      <Motion as={SideSheet} name="fade" variant="modal" title="Filters">
        Body
      </Motion>,
    );
    expect(modal.startsWith('<span data-motion-box="none"')).toBe(true);
    const standard = renderToString(
      <Motion as={SideSheet} name="fade" title="Filters">
        Body
      </Motion>,
    );
    expect(standard.startsWith('<span data-motion-box="child"')).toBe(true);
  });

  it('a modal SideSheet, an AnchorPositioner and a ContextMenu bind nothing, each reported', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const anchor = { current: document.createElement('button') };
    document.body.append(anchor.current);
    const { container } = render(
      <>
        <Motion as={SideSheet} name="fade" variant="modal" title="Filters">
          Body
        </Motion>
        <Motion as={AnchorPositioner} name="fade" anchorRef={anchor}>
          Panel
        </Motion>
        <Motion as={ContextMenu} name="press" accessibleLabel="Actions" trigger={<button type="button">Doc</button>}>
          <MenuItem label="Rename" />
        </Motion>
      </>,
    );
    await act(async () => {});
    const hosts = [...container.children] as HTMLElement[];
    expect(hosts.map((host) => host.getAttribute('data-motion-box'))).toEqual(['none', 'none', 'none']);
    for (const host of hosts) expect(getMotions(host)).toEqual([]);
    expect(getMotions(screen.getByRole('button', { name: 'Doc' }))).toEqual([]);
    expect(reported(error, 'has no box to give')).toHaveLength(3);
    anchor.current.remove();
  });
});
