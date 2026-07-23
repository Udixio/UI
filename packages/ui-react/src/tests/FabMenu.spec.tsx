import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { vi } from 'vitest';
import { faFile, faPlus, faShare } from '@fortawesome/free-solid-svg-icons';
import { FabMenu, type FabMenuAction } from '../lib/index.js';

expect.extend(toHaveNoViolations);

const actions: FabMenuAction[] = [
  { id: 'document', label: 'Document', icon: faFile },
  { id: 'share', label: 'Share', icon: faShare, href: '/share' },
];

describe('FabMenu', () => {
  it('does not render an unnamed disclosure', () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const { container } = render(
      <FabMenu label="" icon={faPlus} actions={actions} />,
    );

    expect(container).toBeEmptyDOMElement();
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('exposes a controlled disclosure relationship', () => {
    render(<FabMenu label="Create" icon={faPlus} actions={actions} />);
    const trigger = screen.getByRole('button', { name: 'Create' });

    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveAttribute('aria-controls');
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
  });

  it('opens, labels the action group, and focuses the first action', async () => {
    render(<FabMenu label="Create" icon={faPlus} actions={actions} />);
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    expect(screen.getByRole('group', { name: 'Create actions' })).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Close Create' }),
    ).toHaveAttribute('aria-expanded', 'true');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Document' })).toHaveFocus(),
    );
  });

  it('selects an action, closes, and restores trigger focus', async () => {
    const onActionSelect = vi.fn();
    render(
      <FabMenu
        label="Create"
        icon={faPlus}
        actions={actions}
        onActionSelect={onActionSelect}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    fireEvent.click(screen.getByRole('button', { name: 'Document' }));

    expect(onActionSelect).toHaveBeenCalledWith(actions[0], 0);
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Create' })).toHaveFocus(),
    );
  });

  it('closes on Escape and restores trigger focus', async () => {
    render(
      <FabMenu label="Create" icon={faPlus} actions={actions} defaultOpen />,
    );
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Document' })).toHaveFocus(),
    );
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('group')).not.toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Create' })).toHaveFocus(),
    );
  });

  it('closes on an outside press', () => {
    render(
      <div>
        <FabMenu label="Create" icon={faPlus} actions={actions} defaultOpen />
        <button>Outside</button>
      </div>,
    );
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Outside' }));
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
  });

  it('requests controlled state without mutating it', () => {
    const onOpenChange = vi.fn();
    render(
      <FabMenu
        label="Create"
        icon={faPlus}
        actions={actions}
        open={false}
        onOpenChange={onOpenChange}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
  });

  it('does not open while disabled', () => {
    render(<FabMenu label="Create" icon={faPlus} actions={actions} disabled />);
    const trigger = screen.getByRole('button', { name: 'Create' });
    expect(trigger).toBeDisabled();
    fireEvent.click(trigger);
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
  });

  it('has no automated accessibility violations', async () => {
    const { container } = render(
      <FabMenu label="Create" icon={faPlus} actions={actions} defaultOpen />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
