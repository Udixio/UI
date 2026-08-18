import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { expect, vi } from 'vitest';
import {
  ContextMenu,
  Menu,
  MenuGroup,
  MenuHeadline,
  MenuItem,
} from '../lib/index.js';

expect.extend(toHaveNoViolations);

describe('Menu family', () => {
  it('renders action-menu semantics and shared family structure', () => {
    render(
      <Menu accessibleLabel="Edit actions">
        <MenuGroup label="Editing">
          <MenuHeadline label="Clipboard" />
          <MenuItem label="Copy" />
          <MenuItem label="Paste" disabled />
        </MenuGroup>
      </Menu>,
    );

    expect(screen.getByRole('menu', { name: 'Edit actions' })).toBeVisible();
    expect(screen.getByRole('group', { name: 'Editing' })).toBeVisible();
    expect(screen.getByRole('group', { name: 'Editing' })).toHaveClass(
      'rounded-lg',
      'first:rounded-t-2xl',
      'last:rounded-b-2xl',
    );
    expect(screen.getByRole('menuitem', { name: 'Copy' })).toBeVisible();
    expect(screen.getByRole('menuitem', { name: 'Paste' })).toBeDisabled();
    expect(screen.getByRole('menuitem', { name: 'Paste' })).not.toHaveClass(
      'bg-secondary-container',
    );
    expect(
      screen
        .getByRole('menuitem', { name: 'Paste' })
        .querySelector('[aria-hidden="true"]'),
    ).toBeNull();
    expect(screen.getByText('Clipboard')).toHaveAttribute(
      'role',
      'presentation',
    );
  });

  it('renders listbox semantics for selection purpose', () => {
    render(
      <Menu purpose="selection" accessibleLabel="Fruit">
        <MenuItem label="Apple" selected />
        <MenuItem label="Pear" />
      </Menu>,
    );

    expect(screen.getByRole('listbox', { name: 'Fruit' })).toBeVisible();
    expect(screen.getByRole('option', { name: 'Apple' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('option', { name: 'Pear' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });

  it('owns uncontrolled selection and emits once', () => {
    const onSelectedChange = vi.fn();
    render(
      <Menu accessibleLabel="Formatting">
        <MenuItem
          label="Bold"
          selectionType="multiple"
          defaultSelected={false}
          onSelectedChange={onSelectedChange}
        />
      </Menu>,
    );
    const item = screen.getByRole('menuitemcheckbox', { name: 'Bold' });

    fireEvent.click(item);
    expect(item).toHaveAttribute('aria-checked', 'true');
    expect(item).toHaveClass(
      'bg-secondary-container',
      'text-on-secondary-container',
    );
    expect(item.querySelector('[aria-hidden="true"]')).toHaveClass(
      'state-ripple-group-[menu-item]',
    );
    expect(onSelectedChange).toHaveBeenCalledOnce();
    expect(onSelectedChange).toHaveBeenLastCalledWith(true);
  });

  it('requests controlled selection without mutating local state', () => {
    const onSelectedChange = vi.fn();
    render(
      <Menu accessibleLabel="Formatting">
        <MenuItem
          label="Bold"
          selectionType="multiple"
          selected={false}
          onSelectedChange={onSelectedChange}
        />
      </Menu>,
    );
    const item = screen.getByRole('menuitemcheckbox', { name: 'Bold' });

    fireEvent.click(item);
    expect(onSelectedChange).toHaveBeenCalledWith(true);
    expect(item).toHaveAttribute('aria-checked', 'false');
  });

  it('moves focus with arrows and skips disabled items', () => {
    render(
      <Menu accessibleLabel="Actions">
        <MenuItem label="First" />
        <MenuItem label="Blocked" disabled />
        <MenuItem label="Last" />
      </Menu>,
    );
    const first = screen.getByRole('menuitem', { name: 'First' });
    const last = screen.getByRole('menuitem', { name: 'Last' });
    first.focus();
    fireEvent.keyDown(first, { key: 'ArrowDown' });
    expect(last).toHaveFocus();
    fireEvent.keyDown(last, { key: 'ArrowDown' });
    expect(first).toHaveFocus();
  });

  it('makes disabled links inert', () => {
    render(
      <Menu accessibleLabel="Navigation">
        <MenuItem label="Archive" href="/archive" disabled />
      </Menu>,
    );
    const item = screen.getByRole('menuitem', { name: 'Archive' });
    expect(item).not.toHaveAttribute('href');
    expect(item).toHaveAttribute('aria-disabled', 'true');
    expect(item).toHaveAttribute('tabindex', '-1');
  });

  it('opens a context menu with Shift+F10 and restores focus on Escape', async () => {
    const onOpenChange = vi.fn();
    render(
      <ContextMenu
        accessibleLabel="Card actions"
        trigger={<button>Document</button>}
        onOpenChange={onOpenChange}
      >
        <MenuItem label="Rename" />
      </ContextMenu>,
    );
    const trigger = screen.getByRole('button', { name: 'Document' });
    trigger.focus();
    fireEvent.keyDown(trigger, { key: 'F10', shiftKey: true });

    const item = await screen.findByRole('menuitem', { name: 'Rename' });
    expect(onOpenChange).toHaveBeenCalledWith(true);
    await waitFor(() => expect(item).toHaveFocus());
    fireEvent.keyDown(item, { key: 'Escape' });
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(onOpenChange).toHaveBeenCalledTimes(2);
  });

  it('opens a context menu at the secondary-click position', async () => {
    render(
      <ContextMenu
        accessibleLabel="Card actions"
        trigger={<button>Document</button>}
      >
        <MenuItem label="Rename" />
      </ContextMenu>,
    );

    fireEvent.contextMenu(screen.getByRole('button', { name: 'Document' }), {
      clientX: 120,
      clientY: 80,
    });

    expect(
      await screen.findByRole('menu', { name: 'Card actions' }),
    ).toBeVisible();
    expect(screen.getByRole('menu').parentElement).toHaveStyle({
      left: '120px',
      top: '80px',
    });
  });

  it('has no automated accessibility violations', async () => {
    const { container } = render(
      <Menu accessibleLabel="Actions">
        <MenuGroup label="Editing">
          <MenuItem label="Copy" />
          <MenuItem label="Pinned" selectionType="multiple" defaultSelected />
        </MenuGroup>
      </Menu>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
