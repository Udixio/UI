import { afterEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import { axe } from 'jest-axe';
import { iAdd } from '@udixio/icons-rounded-400/add';
import { iClose } from '@udixio/icons-rounded-400/close';
import { iStar } from '@udixio/icons-rounded-400/star';
import IconButton from './IconButton.svelte';
import Fixture from './icon-button.fixture.svelte';

vi.mock('@udixio/core/dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@udixio/core/dom')>();
  return {
    ...actual,
    createTooltipTransitionController: vi.fn(() => ({ setOpen: vi.fn(), destroy: vi.fn() })),
  };
});

describe('IconButton', () => {
  afterEach(() => {
    cleanup();
    document.querySelectorAll('[role="tooltip"]').forEach((element) => element.remove());
  });

  it('does not render an unnamed control', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { container } = render(IconButton, { props: { label: '', icon: iAdd } });
    flushSync();

    expect(container.querySelector('button, a')).toBeNull();
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('renders one named native button with safe form defaults', () => {
    render(IconButton, { props: { label: 'Add item', icon: iAdd } });

    const button = screen.getByRole('button', { name: 'Add item' });
    expect(button).toHaveAttribute('type', 'button');
    expect(button.querySelector('svg')).toBeInTheDocument();
    expect(button.querySelector('.touch-target')).toBeInTheDocument();
    expect(button.querySelector('.state-layer')).toBeInTheDocument();
  });

  it('shows its accessible label in a tooltip on focus by default', async () => {
    render(IconButton, { props: { label: 'Add item', icon: iAdd } });
    const button = screen.getByRole('button', { name: 'Add item' });

    await fireEvent.focus(button);
    flushSync();

    expect(screen.getByRole('tooltip')).toHaveTextContent('Add item');
    expect(button).not.toHaveAttribute('aria-describedby');
  });

  it('supports custom tooltip text and explicit tooltip suppression', async () => {
    const custom = render(IconButton, {
      props: { label: 'Add item', icon: iAdd, tooltip: 'Create a new item' },
    });
    const button = screen.getByRole('button', { name: 'Add item' });
    await fireEvent.focus(button);
    flushSync();
    const tooltip = screen.getByRole('tooltip');

    expect(tooltip).toHaveTextContent('Create a new item');
    expect(button).toHaveAttribute('aria-describedby', tooltip.id);
    custom.unmount();

    render(IconButton, { props: { label: 'Close', icon: iClose, tooltip: false } });
    flushSync();
    expect(screen.queryByRole('tooltip', { hidden: true })).not.toBeInTheDocument();
  });

  it('keeps container padding separate from the icon dimensions', () => {
    render(IconButton, { props: { label: 'Add item', icon: iAdd, size: 'small' } });

    const button = screen.getByRole('button', { name: 'Add item' });
    const icon = button.querySelector('.icon');
    expect(button).toHaveClass('shrink-0', 'p-2');
    expect(icon).toHaveClass('size-6');
    expect(icon).not.toHaveClass('p-2');
  });

  it('forwards native button attributes', () => {
    render(IconButton, {
      props: {
        label: 'Submit',
        icon: iAdd,
        type: 'submit',
        tabindex: 2,
        title: 'Submit item',
        'data-testid': 'submit',
      },
    });

    const button = screen.getByTestId('submit');
    expect(button).toHaveAttribute('type', 'submit');
    expect(button).toHaveAttribute('tabindex', '2');
    expect(button).not.toHaveAttribute('title');
  });

  it('uses the legacy title as tooltip text without forwarding it to the DOM', async () => {
    render(IconButton, { props: { label: 'Submit', icon: iAdd, title: 'Submit item' } });

    await fireEvent.focus(screen.getByRole('button', { name: 'Submit' }));
    expect(screen.getByRole('tooltip')).toHaveTextContent('Submit item');
  });

  it('calls action callbacks once', async () => {
    const onclick = vi.fn();
    render(IconButton, { props: { label: 'Add', icon: iAdd, onclick } });

    await fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(onclick).toHaveBeenCalledTimes(1);
  });

  it('keeps action and pressed-change callbacks independent', async () => {
    const onclick = vi.fn();
    const onPressedChange = vi.fn();
    render(IconButton, {
      props: { label: 'Favorite', icon: iStar, toggleable: true, onclick, onPressedChange },
    });

    await fireEvent.click(screen.getByRole('button', { name: 'Favorite' }));

    expect(onclick).toHaveBeenCalledTimes(1);
    expect(onPressedChange).toHaveBeenCalledWith(true);
  });

  it('blocks disabled action callbacks', async () => {
    const onclick = vi.fn();
    render(IconButton, { props: { label: 'Add', icon: iAdd, disabled: true, onclick } });

    await fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(onclick).not.toHaveBeenCalled();
  });

  it('does not open a tooltip for a disabled link', async () => {
    render(IconButton, {
      props: { label: 'Disabled documentation', icon: iAdd, href: '/docs', disabled: true },
    });
    const link = screen.getByRole('link', { name: 'Disabled documentation' });

    await fireEvent.mouseOver(link);
    await fireEvent.focus(link);

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    expect(link).not.toHaveAttribute('aria-describedby');
  });

  it('owns uncontrolled pressed state and swaps the icon', async () => {
    const onPressedChange = vi.fn();
    const { container } = render(IconButton, {
      props: {
        label: 'Favorite',
        icon: iStar,
        pressedIcon: iClose,
        toggleable: true,
        defaultPressed: true,
        onPressedChange,
      },
    });
    const button = screen.getByRole('button', { name: 'Favorite' });
    const initialPath = container.querySelector('path')?.getAttribute('d');

    expect(button).toHaveAttribute('aria-pressed', 'true');
    await fireEvent.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(onPressedChange).toHaveBeenCalledWith(false);
    expect(container.querySelector('path')?.getAttribute('d')).not.toBe(initialPath);
  });

  it('follows the owner through bind:pressed', async () => {
    const onPressedChange = vi.fn();
    const { component } = render(Fixture, {
      props: { label: 'Favorite', icon: iStar, mode: 'bind', onPressedChange },
    });
    const button = screen.getByRole('button', { name: 'Favorite' });

    expect(button).toHaveAttribute('aria-pressed', 'false');
    await fireEvent.click(button);

    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(onPressedChange).toHaveBeenCalledWith(true);
    expect(component.readPressed()).toBe(true);
  });

  it('lets a function binding reject a controlled pressed change', async () => {
    const onPressedChange = vi.fn();
    const { component } = render(Fixture, {
      props: {
        label: 'Favorite',
        icon: iStar,
        mode: 'function-binding',
        accept: () => false,
        onPressedChange,
      },
    });
    const button = screen.getByRole('button', { name: 'Favorite' });

    await fireEvent.click(button);

    expect(onPressedChange).toHaveBeenCalledWith(true);
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(component.readPressed()).toBe(false);
  });

  it('requests controlled pressed changes and hands them to the owner', async () => {
    const onPressedChange = vi.fn();
    render(IconButton, {
      props: { label: 'Favorite', icon: iStar, toggleable: true, pressed: false, onPressedChange },
    });

    await fireEvent.click(screen.getByRole('button', { name: 'Favorite' }));
    expect(onPressedChange).toHaveBeenCalledWith(true);
  });

  it('does not expose pressed semantics without toggleable', () => {
    render(IconButton, { props: { label: 'Add', icon: iAdd, defaultPressed: true } });
    expect(screen.getByRole('button', { name: 'Add' })).not.toHaveAttribute('aria-pressed');
  });

  it('renders navigation as a link and ignores toggle semantics', () => {
    render(IconButton, {
      props: {
        label: 'Documentation',
        icon: iAdd,
        href: '/docs',
        toggleable: true,
        defaultPressed: true,
        'aria-current': 'page',
      },
    });
    const link = screen.getByRole('link', { name: 'Documentation' });

    expect(link).toHaveAttribute('href', '/docs');
    expect(link).toHaveAttribute('aria-current', 'page');
    expect(link).not.toHaveAttribute('aria-pressed');
  });

  it('makes disabled links inert', async () => {
    const onclick = vi.fn();
    render(IconButton, {
      props: { label: 'Disabled documentation', icon: iAdd, href: '/docs', disabled: true, onclick },
    });
    const link = screen.getByRole('link', { name: 'Disabled documentation' });

    expect(link).not.toHaveAttribute('href');
    expect(link).toHaveAttribute('aria-disabled', 'true');
    expect(link).toHaveAttribute('tabindex', '-1');
    await fireEvent.click(link);
    expect(onclick).not.toHaveBeenCalled();
  });

  it.each(['Enter', ' '])('preserves native %s keyboard activation', (key) => {
    const onclick = vi.fn();
    render(IconButton, { props: { label: 'Keyboard action', icon: iAdd, onclick } });
    const button = screen.getByRole('button', { name: 'Keyboard action' });

    expect(
      button.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })),
    ).toBe(true);
    button.click();
    expect(onclick).toHaveBeenCalledTimes(1);
  });

  it('connects pointer feedback and cleans it up', async () => {
    const { unmount } = render(IconButton, { props: { label: 'Pointer action', icon: iAdd } });
    const button = screen.getByRole('button', { name: 'Pointer action' });

    await fireEvent.pointerDown(button, { pointerType: 'mouse', clientX: 4, clientY: 4 });
    const ripple = button.querySelector('[data-udixio-ripple]');
    expect(ripple).not.toBeNull();
    unmount();
    expect(ripple?.isConnected).toBe(false);
  });

  it('keeps a static radius when shape feedback is disabled', () => {
    render(IconButton, {
      props: { label: 'Static shape', icon: iAdd, toggleable: true, defaultPressed: true, shapeFeedback: 'none' },
    });

    expect(screen.getByRole('button', { name: 'Static shape' })).toHaveStyle({ borderRadius: '40px' });
  });

  it('merges class and exposes state to classes', () => {
    render(IconButton, {
      props: {
        label: 'Styled',
        icon: iAdd,
        toggleable: true,
        defaultPressed: true,
        class: 'extra',
        classes: (state) => ({ iconButton: `p-${state.isPressed}` }),
      },
    });
    const button = screen.getByRole('button', { name: 'Styled' });
    expect(button.className).toContain('extra');
    expect(button.className).toContain('p-true');
  });

  it('has no automated accessibility violations as an action or link', async () => {
    const action = render(IconButton, { props: { label: 'Add item', icon: iAdd } });
    expect(await axe(action.container)).toHaveNoViolations();
    action.unmount();

    const link = render(IconButton, { props: { label: 'Documentation', icon: iAdd, href: '/docs' } });
    expect(await axe(link.container)).toHaveNoViolations();
  });
});
