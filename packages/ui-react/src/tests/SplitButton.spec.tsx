import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { vi } from 'vitest';
import { iSave } from '@udixio/icons-rounded-400/save';
import { iShare } from '@udixio/icons-rounded-400/share';
import { SplitButton, type SplitButtonAction } from '../lib/index.js';

expect.extend(toHaveNoViolations);

const actions: SplitButtonAction[] = [
  { id: 'copy', label: 'Save a copy', icon: iSave },
  { id: 'share', label: 'Share', icon: iShare, href: '/share' },
];

describe('SplitButton', () => {
  it('renders the primary action and a labelled menu disclosure', () => {
    render(
      <SplitButton
        label="Save"
        menuLabel="More save options"
        actions={actions}
      />,
    );

    const primary = screen.getByRole('button', { name: 'Save' });
    const menuTrigger = screen.getByRole('button', {
      name: 'More save options',
    });
    expect(primary).toHaveAttribute('type', 'button');
    expect(primary).not.toHaveClass('overflow-hidden');
    expect(primary.querySelector('.primary-touch-target')).toHaveClass('h-12');
    expect(menuTrigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(menuTrigger).toHaveAttribute('aria-expanded', 'false');
    expect(menuTrigger).toHaveAttribute('aria-controls');
    expect(menuTrigger).not.toHaveClass('overflow-hidden');
    expect(menuTrigger.querySelector('.menu-touch-target')).toHaveClass('h-12');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('uses the accessible label only when the primary action has no visible label', () => {
    const { rerender } = render(
      <SplitButton
        icon={iSave}
        label=" "
        accessibleLabel="Save"
        menuLabel="More save options"
        actions={actions}
      />,
    );
    expect(screen.getByRole('group', { name: 'Save' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();

    rerender(
      <SplitButton
        label="Save"
        accessibleLabel="Different name"
        menuLabel="More save options"
        actions={actions}
      />,
    );
    expect(screen.getByRole('group', { name: 'Save' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('opens with the trigger and arrow keys, focusing the expected action', async () => {
    render(
      <SplitButton
        label="Save"
        menuLabel="More save options"
        actions={actions}
      />,
    );
    const trigger = screen.getByRole('button', { name: 'More save options' });
    fireEvent.keyDown(trigger, { key: 'ArrowUp' });

    expect(
      await screen.findByRole('menu', { name: 'More save options' }),
    ).toBeVisible();
    expect(document.querySelector('.menu-icon')).not.toHaveClass('rotate-180');
    await waitFor(() =>
      expect(screen.getByRole('menuitem', { name: 'Share' })).toHaveFocus(),
    );
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(trigger);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('connects popup behavior when initially invalid props become valid', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { rerender } = render(
      <SplitButton label="" menuLabel="More save options" actions={actions} />,
    );
    rerender(
      <SplitButton
        label="Save"
        menuLabel="More save options"
        actions={actions}
      />,
    );

    const trigger = screen.getByRole('button', { name: 'More save options' });
    fireEvent.click(trigger);
    const firstAction = await screen.findByRole('menuitem', {
      name: 'Save a copy',
    });
    fireEvent.keyDown(firstAction, { key: 'Escape' });

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
    consoleError.mockRestore();
  });

  it('runs the primary action independently from the menu trigger', () => {
    const onPrimaryAction = vi.fn();
    render(
      <SplitButton
        label="Save"
        menuLabel="More save options"
        actions={actions}
        onPrimaryAction={onPrimaryAction}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onPrimaryAction).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('selects an action, closes the menu, and restores focus', async () => {
    const onActionSelect = vi.fn();
    render(
      <SplitButton
        label="Save"
        menuLabel="More save options"
        actions={actions}
        onActionSelect={onActionSelect}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'More save options' }));
    fireEvent.click(
      await screen.findByRole('menuitem', { name: 'Save a copy' }),
    );

    expect(onActionSelect).toHaveBeenCalledWith(actions[0], 0);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'More save options' }),
      ).toHaveFocus(),
    );
  });

  it('closes on Escape and outside press', async () => {
    render(
      <div>
        <SplitButton
          label="Save"
          menuLabel="More save options"
          actions={actions}
          defaultOpen
        />
        <button>Outside</button>
      </div>,
    );
    const trigger = screen.getByRole('button', { name: 'More save options' });
    const firstItem = await screen.findByRole('menuitem', {
      name: 'Save a copy',
    });
    fireEvent.keyDown(firstItem, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());

    fireEvent.click(trigger);
    await screen.findByRole('menu');
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Outside' }));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('requests controlled open changes without local mutation', () => {
    const onOpenChange = vi.fn();
    render(
      <SplitButton
        label="Save"
        menuLabel="More save options"
        actions={actions}
        open={false}
        onOpenChange={onOpenChange}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'More save options' }));

    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('keeps the menu closed when disabled and requires accessible names', () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const { rerender } = render(
      <SplitButton
        label="Save"
        menuLabel="More save options"
        actions={actions}
        disabled
      />,
    );
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'More save options' }),
    ).toBeDisabled();

    rerender(<SplitButton label="" menuLabel="" actions={[]} />);
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('has no automated accessibility violations when open', async () => {
    const { container } = render(
      <SplitButton
        label="Save"
        menuLabel="More save options"
        actions={actions}
        defaultOpen
      />,
    );
    await screen.findByRole('menu');
    expect(await axe(container)).toHaveNoViolations();
  });
});
