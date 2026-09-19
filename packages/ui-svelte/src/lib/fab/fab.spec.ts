import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import { axe } from 'jest-axe';
import { iAdd } from '@udixio/icons-rounded-400/add';
import { createFabLabelController } from '@udixio/core/dom';
import Fab from './Fab.svelte';

vi.mock('@udixio/core/dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@udixio/core/dom')>();
  return {
    ...actual,
    createFabLabelController: vi.fn(),
    createTooltipTransitionController: vi.fn(() => ({ setOpen: vi.fn(), destroy: vi.fn() })),
  };
});

function mockController() {
  return { update: vi.fn(), destroy: vi.fn() };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createFabLabelController).mockImplementation(() => mockController() as never);
});

describe('Fab', () => {
  afterEach(() => {
    cleanup();
    document.querySelectorAll('[role="tooltip"]').forEach((element) => element.remove());
  });

  it('does not render an unnamed control', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { container } = render(Fab, { props: { label: '', icon: iAdd } });
    flushSync();

    expect(container.querySelector('button, a')).toBeNull();
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('renders a named action with safe form defaults', () => {
    render(Fab, { props: { label: 'Create', icon: iAdd } });

    const button = screen.getByRole('button', { name: 'Create' });
    expect(button).toHaveAttribute('type', 'button');
    expect(button.querySelector('svg')).toBeInTheDocument();
    expect(button.querySelector('.touch-target')).toBeInTheDocument();
    expect(button.querySelector('.state-layer')).toBeInTheDocument();
  });

  it('keeps the label mounted but collapsed until the fab is extended', async () => {
    const { rerender } = render(Fab, { props: { label: 'Create', icon: iAdd } });
    const button = screen.getByRole('button', { name: 'Create' });
    const label = button.querySelector('.label');

    expect(label).toBeInTheDocument();
    expect(label).toHaveStyle({ width: '0px', opacity: '0' });
    expect(label).toHaveAttribute('aria-hidden', 'true');
    expect(button).toHaveAttribute('aria-label', 'Create');

    await rerender({ label: 'Create', icon: iAdd, extended: true });
    flushSync();
    expect(label).not.toHaveAttribute('aria-hidden');
    expect(screen.getByRole('button', { name: 'Create' })).not.toHaveAttribute('aria-label');
  });

  it('names its icon in a tooltip while compact without describing itself twice', async () => {
    render(Fab, { props: { label: 'Create', icon: iAdd } });
    const button = screen.getByRole('button', { name: 'Create' });

    await fireEvent.focus(button);
    flushSync();

    expect(screen.getByRole('tooltip')).toHaveTextContent('Create');
    expect(button).not.toHaveAttribute('aria-describedby');
  });

  it('drops the tooltip once extended', async () => {
    const { rerender } = render(Fab, { props: { label: 'Create', icon: iAdd } });
    await rerender({ label: 'Create', icon: iAdd, extended: true });
    flushSync();
    const button = screen.getByRole('button', { name: 'Create' });

    await fireEvent.focus(button);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('supports custom tooltip text and explicit tooltip suppression', async () => {
    const custom = render(Fab, {
      props: { label: 'Create', icon: iAdd, tooltip: 'Create a new item' },
    });
    const button = screen.getByRole('button', { name: 'Create' });
    await fireEvent.focus(button);
    flushSync();
    const tooltip = screen.getByRole('tooltip');

    expect(tooltip).toHaveTextContent('Create a new item');
    expect(button).toHaveAttribute('aria-describedby', tooltip.id);
    custom.unmount();

    render(Fab, { props: { label: 'Edit', icon: iAdd, tooltip: false } });
    expect(screen.queryByRole('tooltip', { hidden: true })).not.toBeInTheDocument();
  });

  it('does not open a tooltip for a disabled link', async () => {
    render(Fab, {
      props: { label: 'Disabled create', icon: iAdd, href: '/create', disabled: true },
    });
    const link = screen.getByRole('link', { name: 'Disabled create' });

    await fireEvent.mouseOver(link);
    await fireEvent.focus(link);

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    expect(link).not.toHaveAttribute('aria-describedby');
  });

  it('renders an extended fab with its label already open', () => {
    render(Fab, { props: { label: 'Edit', icon: iAdd, extended: true } });

    expect(screen.getByText('Edit')).toHaveStyle({ width: 'auto', opacity: '1' });
  });

  it('wires the label controller once and updates it on every extended change', async () => {
    const controller = mockController();
    vi.mocked(createFabLabelController).mockReturnValue(controller as never);
    const { rerender } = render(Fab, { props: { label: 'Create', icon: iAdd } });

    expect(createFabLabelController).toHaveBeenCalledTimes(1);
    expect(vi.mocked(createFabLabelController).mock.calls[0][0].label).toBe(
      screen.getByRole('button', { name: 'Create' }).querySelector('.label'),
    );

    await rerender({ label: 'Create', icon: iAdd, extended: true });
    await rerender({ label: 'Create', icon: iAdd, extended: false });

    expect(createFabLabelController).toHaveBeenCalledTimes(1);
    expect(controller.update).toHaveBeenCalledTimes(3);
  });

  it('forwards native action attributes, title, and classes', async () => {
    render(Fab, {
      props: {
        label: 'Submit',
        icon: iAdd,
        type: 'submit',
        tabindex: 2,
        title: 'Submit item',
        class: 'consumer-class',
        classes: () => ({ fab: 'state-class' }),
        'data-testid': 'submit',
      },
    });

    const button = screen.getByTestId('submit');
    expect(button).toHaveAttribute('type', 'submit');
    expect(button).toHaveAttribute('tabindex', '2');
    expect(button).toHaveAttribute('title', 'Submit item');
    expect(button.className).toContain('consumer-class');
    expect(button.className).toContain('state-class');

    await fireEvent.focus(button);
    expect(screen.getByRole('tooltip')).toHaveTextContent('Submit item');
  });

  it('fires actions and blocks disabled actions', async () => {
    const onclick = vi.fn();
    const { rerender } = render(Fab, { props: { label: 'Create', icon: iAdd, onclick } });
    await fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(onclick).toHaveBeenCalledTimes(1);

    await rerender({ label: 'Create', icon: iAdd, onclick, disabled: true });
    await fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(onclick).toHaveBeenCalledTimes(1);
  });

  it('renders links and makes disabled links inert', async () => {
    const onclick = vi.fn();
    const { rerender } = render(Fab, {
      props: { label: 'Create', icon: iAdd, href: '/create', 'aria-current': 'page', onclick },
    });
    let link = screen.getByRole('link', { name: 'Create' });
    expect(link).toHaveAttribute('href', '/create');
    expect(link).toHaveAttribute('aria-current', 'page');

    await rerender({
      label: 'Create',
      icon: iAdd,
      href: '/create',
      disabled: true,
      onclick,
    });
    link = screen.getByRole('link', { name: 'Create' });
    expect(link).not.toHaveAttribute('href');
    expect(link).toHaveAttribute('aria-disabled', 'true');
    expect(link).toHaveAttribute('tabindex', '-1');
    await fireEvent.click(link);
    expect(onclick).not.toHaveBeenCalled();
  });

  it('connects pointer feedback and cleans it up', async () => {
    const { unmount } = render(Fab, { props: { label: 'Create', icon: iAdd } });
    const button = screen.getByRole('button', { name: 'Create' });

    await fireEvent.pointerDown(button, { pointerType: 'mouse', clientX: 4, clientY: 4 });
    const ripple = button.querySelector('[data-udixio-ripple]');
    expect(ripple).not.toBeNull();
    unmount();
    expect(ripple?.isConnected).toBe(false);
  });

  it('has no automated accessibility violations for action and link variants', async () => {
    const { container } = render(Fab, {
      props: { label: 'Create', icon: iAdd, extended: true },
    });
    expect(await axe(container)).toHaveNoViolations();
  });
});
