import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Menu, MenuItem, MenuSubmenu } from '../lib/index.js';

describe('MenuSubmenu', () => {
  it('keeps the nested menu in the DOM, hidden, until the submenu opens', async () => {
    render(
      <Menu accessibleLabel="Actions">
        <MenuSubmenu label="Share">
          <MenuItem label="Copy link" />
        </MenuSubmenu>
        <MenuItem label="Rename" />
      </Menu>,
    );

    const trigger = screen.getByRole('menuitem', { name: 'Share' });
    expect(
      screen.getByRole('menuitem', { name: 'Copy link', hidden: true }),
    ).not.toBeVisible();

    trigger.focus();
    fireEvent.keyDown(trigger, { key: 'ArrowRight' });

    const copy = screen.getByRole('menuitem', { name: 'Copy link' });
    expect(copy).toBeVisible();
    await waitFor(() => expect(copy).toHaveFocus());
  });

  it('moves focus inside the nested menu without leaving it for the parent', async () => {
    render(
      <Menu accessibleLabel="Actions">
        <MenuSubmenu label="Share">
          <MenuItem label="Copy link" />
          <MenuItem label="Send by email" />
        </MenuSubmenu>
        <MenuItem label="Rename" />
      </Menu>,
    );

    const trigger = screen.getByRole('menuitem', { name: 'Share' });
    trigger.focus();
    fireEvent.keyDown(trigger, { key: 'ArrowRight' });
    const copy = screen.getByRole('menuitem', { name: 'Copy link' });
    await waitFor(() => expect(copy).toHaveFocus());

    fireEvent.keyDown(copy, { key: 'ArrowDown' });

    expect(
      screen.getByRole('menuitem', { name: 'Send by email' }),
    ).toHaveFocus();
  });

  it('grows the nested menu from its trigger and keeps it shown, inert, until its exit ends', async () => {
    render(
      <Menu accessibleLabel="Actions">
        <MenuSubmenu label="Share">
          <MenuItem label="Copy link" />
        </MenuSubmenu>
        <MenuItem label="Rename" />
      </Menu>,
    );
    const trigger = screen.getByRole('menuitem', { name: 'Share' });
    const nested = screen.getByRole('menu', { name: 'Share submenu', hidden: true });
    const surface = nested.parentElement as HTMLElement;

    trigger.focus();
    fireEvent.keyDown(trigger, { key: 'ArrowRight' });
    expect(surface).not.toHaveAttribute('hidden');
    // The motion controller points the scale at the trigger.
    expect(nested.style.transformOrigin).not.toBe('');

    fireEvent.keyDown(screen.getByRole('menuitem', { name: 'Copy link' }), {
      key: 'Escape',
    });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    // Closed at once for assistive technologies and the keyboard, still seen until the exit has played.
    expect(surface).toHaveAttribute('inert');
    expect(surface).not.toHaveAttribute('hidden');
    await waitFor(() => expect(surface).toHaveAttribute('hidden'));
  });

  it('keeps a lazy nested menu rendered until its exit ends', async () => {
    render(
      <Menu accessibleLabel="Actions">
        <MenuSubmenu label="Share" lazy>
          <MenuItem label="Copy link" />
        </MenuSubmenu>
      </Menu>,
    );
    const trigger = screen.getByRole('menuitem', { name: 'Share' });
    trigger.focus();
    fireEvent.keyDown(trigger, { key: 'ArrowRight' });
    const copy = screen.getByRole('menuitem', { name: 'Copy link' });

    fireEvent.keyDown(copy, { key: 'Escape' });
    expect(copy).toBeInTheDocument();
    await waitFor(() => expect(copy).not.toBeInTheDocument());
  });
});
