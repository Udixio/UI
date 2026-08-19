import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { vi } from 'vitest';
import { iAdd } from '@udixio/icons-rounded-400/add';
import { iDescription } from '@udixio/icons-rounded-400/description';
import { iShare } from '@udixio/icons-rounded-400/share';
import { FabMenu, type FabMenuAction } from '../lib/index.js';

expect.extend(toHaveNoViolations);

// The trigger is a `Fab`, whose label controller drives Anime.js Layout --
// WAAPI-based, so unusable under jsdom. Mocking the already-isolated
// controller factory (rather than `animejs`, which corrupts the sibling
// `@udixio/core` entry under Vite's dependency pre-bundling) keeps this suite
// about the menu itself; the label transition is covered in Fab.spec.tsx and
// in the core controller's own spec.
vi.mock('@udixio/core/dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@udixio/core/dom')>();
  return {
    ...actual,
    createFabLabelController: vi.fn(() => ({
      update: vi.fn(),
      destroy: vi.fn(),
    })),
  };
});

const actions: FabMenuAction[] = [
  { id: 'document', label: 'Document', icon: iDescription },
  { id: 'share', label: 'Share', icon: iShare, href: '/share' },
];

describe('FabMenu', () => {
  it('does not render an unnamed disclosure', () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const { container } = render(
      <FabMenu label="" icon={iAdd} actions={actions} />,
    );

    expect(container).toBeEmptyDOMElement();
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('exposes a controlled disclosure relationship', () => {
    render(<FabMenu label="Create" icon={iAdd} actions={actions} />);
    const trigger = screen.getByRole('button', { name: 'Create' });

    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveAttribute('aria-controls');
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
  });

  it('opens, labels the action group, and focuses the first action', async () => {
    render(<FabMenu label="Create" icon={iAdd} actions={actions} />);
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    expect(screen.getByRole('group', { name: 'Create actions' })).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Close Create' }),
    ).toHaveAttribute('aria-expanded', 'true');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Document' })).toHaveFocus(),
    );
  });

  it('contracts an extended container trigger into an icon-only color trigger', () => {
    const { container } = render(
      <FabMenu
        label="Create"
        icon={iAdd}
        actions={actions}
        variant="secondary"
        size="large"
        extended
      />,
    );
    const closedTrigger = screen.getByRole('button', { name: 'Create' });
    expect(closedTrigger).toHaveTextContent('Create');
    expect(closedTrigger).toHaveClass('bg-secondary-container', 'h-24');
    const triggerSizer = container.querySelector(
      '.invisible[aria-hidden="true"][inert]',
    );
    expect(triggerSizer).toBeInTheDocument();
    expect(triggerSizer?.querySelector('button')).toHaveClass('h-24');

    fireEvent.click(closedTrigger);

    const openTrigger = screen.getByRole('button', { name: 'Close Create' });
    // The Fab keeps its label mounted so the shared controller can collapse
    // it; the compact trigger hides it from the accessibility tree rather
    // than unmounting it.
    expect(openTrigger.querySelector('.label')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    expect(openTrigger).toHaveClass(
      'bg-secondary',
      'rounded-full',
      'h-20',
      'shadow-none',
    );
    expect(openTrigger).not.toHaveClass('h-24');
  });

  it('selects an action, closes, and restores trigger focus', async () => {
    const onActionSelect = vi.fn();
    render(
      <FabMenu
        label="Create"
        icon={iAdd}
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
      <FabMenu label="Create" icon={iAdd} actions={actions} defaultOpen />,
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
        <FabMenu label="Create" icon={iAdd} actions={actions} defaultOpen />
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
        icon={iAdd}
        actions={actions}
        open={false}
        onOpenChange={onOpenChange}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
  });

  it('keeps focus in an open controlled group until its owner accepts closing', async () => {
    const onOpenChange = vi.fn();
    render(
      <FabMenu
        label="Create"
        icon={iAdd}
        actions={actions}
        open
        onOpenChange={onOpenChange}
      />,
    );
    const action = await screen.findByRole('button', { name: 'Document' });
    fireEvent.click(action);

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(
      screen.getByRole('group', { name: 'Create actions' }),
    ).toBeInTheDocument();
    expect(action).toHaveFocus();
  });

  it('uses the action color family for its state layer', () => {
    render(
      <FabMenu
        label="Create"
        icon={iAdd}
        actions={actions}
        variant="secondary"
        defaultOpen
      />,
    );

    expect(
      screen
        .getByRole('button', { name: 'Document' })
        .querySelector('.action-state-layer'),
    ).toHaveClass('[--default-color:var(--color-on-secondary-container)]');
  });

  it('does not open while disabled', () => {
    render(<FabMenu label="Create" icon={iAdd} actions={actions} disabled />);
    const trigger = screen.getByRole('button', { name: 'Create' });
    expect(trigger).toBeDisabled();
    fireEvent.click(trigger);
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
  });

  it('has no automated accessibility violations', async () => {
    const { container } = render(
      <FabMenu label="Create" icon={iAdd} actions={actions} defaultOpen />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
