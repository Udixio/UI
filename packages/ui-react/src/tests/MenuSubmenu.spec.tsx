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
});
