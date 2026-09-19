import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import { axe } from 'jest-axe';
import { iAdd } from '@udixio/icons-rounded-400/add';
import Button from './Button.svelte';
import Fixture from './button.fixture.svelte';

describe('Button', () => {
  it('renders correctly with default props', () => {
    render(Button, { props: { label: 'Test Button' } });

    const label = screen.getByText('Test Button');
    const button = label.closest('button');
    expect(label).toBeInTheDocument();
    expect(button?.querySelector('.touch-target')).not.toBeNull();
    expect(button?.querySelector('.state-layer')).not.toBeNull();
    expect(button).toHaveStyle({ borderRadius: '40px' });
    expect(button?.className).not.toContain('active:rounded');
    expect(button?.querySelector<HTMLElement>('.state-layer')).toHaveStyle({
      borderRadius: 'inherit',
    });
  });

  it('disables the button when disabled prop is true', () => {
    render(Button, { props: { label: 'Test Button', disabled: true } });

    expect(screen.getByText('Test Button').closest('button')).toBeDisabled();
  });

  it('calls onclick handler when clicked', async () => {
    const onclick = vi.fn();
    render(Button, { props: { label: 'Test Button', onclick } });

    await fireEvent.click(screen.getByText('Test Button'));

    expect(onclick).toHaveBeenCalledTimes(1);
  });

  it('does not call onclick handler when disabled', async () => {
    const onclick = vi.fn();
    render(Button, { props: { label: 'Test Button', onclick, disabled: true } });

    await fireEvent.click(screen.getByText('Test Button'));

    expect(onclick).not.toHaveBeenCalled();
  });

  it('renders with an icon when icon prop is provided', () => {
    render(Button, { props: { label: 'Test Button', icon: iAdd } });

    expect(screen.getByText('Test Button').closest('button')?.querySelector('svg')).toBeInTheDocument();
  });

  it('renders as an anchor tag when href is provided', () => {
    render(Button, { props: { label: 'Test Button', href: 'https://example.com' } });

    expect(screen.getByText('Test Button').closest('a')).toHaveAttribute('href', 'https://example.com');
  });

  it('shows loading indicator when loading prop is true', () => {
    const { container } = render(Button, { props: { label: 'Test Button', loading: true } });

    const button = container.querySelector('button');
    const label = screen.getByText('Test Button');
    expect(label.className).toContain('opacity-0');
    expect(label.className).not.toContain('invisible');
    expect(screen.getByRole('button', { name: 'Test Button' })).toHaveAttribute('aria-busy', 'true');
    const svg = button?.querySelector('svg');
    expect(svg).toHaveStyle({ '--button-progress-color': 'var(--color-on-primary)' });
    expect(svg?.querySelector('circle')?.getAttribute('class')).toContain(
      '!stroke-[var(--button-progress-color)]',
    );
  });

  it('blocks action events while loading', async () => {
    const onclick = vi.fn();
    render(Button, { props: { label: 'Saving', loading: true, onclick } });

    await fireEvent.click(screen.getByRole('button', { name: 'Saving' }));

    expect(onclick).not.toHaveBeenCalled();
  });

  it('uses blocked interaction styling while loading', () => {
    render(Button, { props: { label: 'Saving', loading: true } });

    const button = screen.getByRole('button', { name: 'Saving' });
    expect(button.className).toContain('cursor-default');
    expect(button.className).not.toContain('hover:shadow-1');
  });

  it.each(['Enter', ' '])('preserves native %s keyboard activation', async (key) => {
    const onclick = vi.fn();
    render(Button, { props: { label: 'Keyboard action', onclick } });

    const button = screen.getByRole('button', { name: 'Keyboard action' });
    const keyEvent = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    expect(button.dispatchEvent(keyEvent)).toBe(true);

    button.click();
    expect(onclick).toHaveBeenCalledTimes(1);
  });

  it('connects pointer feedback and removes it during cleanup', async () => {
    const { unmount } = render(Button, { props: { label: 'Pointer action' } });
    const button = screen.getByRole('button', { name: 'Pointer action' });

    await fireEvent.pointerDown(button, { pointerType: 'mouse', clientX: 4, clientY: 4 });
    const ripple = button.querySelector('[data-udixio-ripple]');
    expect(ripple).not.toBeNull();

    unmount();
    expect(ripple?.isConnected).toBe(false);
  });

  it('renders with type="button" by default to prevent form submission', () => {
    render(Button, { props: { label: 'Test' } });

    expect(screen.getByText('Test').closest('button')).toHaveAttribute('type', 'button');
  });

  it('allows overriding the type attribute', () => {
    render(Button, { props: { label: 'Submit', type: 'submit' } });

    expect(screen.getByText('Submit').closest('button')).toHaveAttribute('type', 'submit');
  });

  it('does not pass type attribute to anchor elements', () => {
    render(Button, { props: { label: 'Link', href: 'https://example.com' } });

    expect(screen.getByText('Link').closest('a')).not.toHaveAttribute('type');
  });

  it('forwards native current-page semantics to links', () => {
    render(Button, { props: { label: 'Current page', href: '/current', 'aria-current': 'page' } });

    expect(screen.getByRole('link', { name: 'Current page' })).toHaveAttribute('aria-current', 'page');
  });

  it('makes disabled links inert with aria-disabled and tabindex', () => {
    render(Button, { props: { label: 'Disabled Link', href: 'https://example.com', disabled: true } });

    const link = screen.getByText('Disabled Link').closest('a');
    expect(link).toHaveAttribute('aria-disabled', 'true');
    expect(link).toHaveAttribute('tabindex', '-1');
    expect(link).toHaveAttribute('role', 'link');
    expect(link).not.toHaveAttribute('href');
  });

  it('does not call onclick on disabled links', async () => {
    const onclick = vi.fn();
    render(Button, {
      props: { label: 'Disabled Link', href: 'https://example.com', disabled: true, onclick },
    });

    await fireEvent.click(screen.getByRole('link'));

    expect(onclick).not.toHaveBeenCalled();
  });

  it('renders nothing and logs an error when no label or children is provided', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const { container } = render(Button, { props: {} });
    flushSync();

    expect(container.querySelector('button, a')).toBeNull();
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('requires one non-empty `label`'));

    errorSpy.mockRestore();
  });

  it('sets aria-pressed on toggle buttons', () => {
    render(Button, { props: { label: 'Toggle', toggleable: true } });

    expect(screen.getByText('Toggle').closest('button')).toHaveAttribute('aria-pressed', 'false');
  });

  it('owns state initialized by defaultPressed in uncontrolled mode', async () => {
    const onPressedChange = vi.fn();
    render(Button, { props: { label: 'Toggle', toggleable: true, defaultPressed: true, onPressedChange } });

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button).toHaveStyle({ borderRadius: '16px' });
    expect(button.className).toContain('rounded-[16px]');
    expect(button.className).not.toContain('rounded-[40px]');

    await fireEvent.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(onPressedChange).toHaveBeenCalledWith(false);
  });

  it('follows the owner through bind:pressed', async () => {
    const onPressedChange = vi.fn();
    const { component } = render(Fixture, { props: { label: 'Toggle', mode: 'bind', onPressedChange } });

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-pressed', 'false');

    await fireEvent.click(button);

    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(onPressedChange).toHaveBeenCalledWith(true);
    expect(component.readPressed()).toBe(true);
  });

  it('requests controlled changes without mutating the owned value', async () => {
    const onPressedChange = vi.fn();
    const { component } = render(Fixture, {
      props: { label: 'Toggle', mode: 'function-binding', accept: () => false, onPressedChange },
    });

    const button = screen.getByRole('button');
    await fireEvent.click(button);

    expect(onPressedChange).toHaveBeenCalledWith(true);
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(component.readPressed()).toBe(false);
  });

  it('keeps action and pressed-change events independent', async () => {
    const onclick = vi.fn();
    const onPressedChange = vi.fn();
    render(Button, { props: { label: 'Toggle', toggleable: true, onclick, onPressedChange } });

    await fireEvent.click(screen.getByRole('button'));

    expect(onclick).toHaveBeenCalledTimes(1);
    expect(onPressedChange).toHaveBeenCalledWith(true);
  });

  it('keeps navigation links out of toggle-button semantics', async () => {
    const onclick = vi.fn();
    const onPressedChange = vi.fn();
    render(Button, {
      props: {
        label: 'Destination',
        href: '/destination',
        toggleable: true,
        defaultPressed: true,
        onclick,
        onPressedChange,
      },
    });

    const link = screen.getByRole('link', { name: 'Destination' });
    expect(link).not.toHaveAttribute('aria-pressed');
    expect(link.className).toContain('bg-primary');

    await fireEvent.click(link);
    expect(onclick).toHaveBeenCalledTimes(1);
    expect(onPressedChange).not.toHaveBeenCalled();
  });

  it.each(['disabled', 'loading'] as const)('blocks pressed changes while %s', async (blockedProp) => {
    const onPressedChange = vi.fn();
    render(Button, { props: { label: 'Toggle', toggleable: true, onPressedChange, [blockedProp]: true } });

    await fireEvent.click(screen.getByRole('button'));

    expect(onPressedChange).not.toHaveBeenCalled();
  });

  it('normalizes variant aliases through the shared core behavior', () => {
    render(Button, { props: { label: 'Secondary', variant: 'secondary' } });

    expect(screen.getByRole('button').className).toContain('bg-secondary-container');
  });

  it('uses the semantic content color for toggle loading indicators', () => {
    render(Button, {
      props: { label: 'Toggle', variant: 'tonal', toggleable: true, defaultPressed: true, loading: true },
    });

    expect(screen.getByRole('button').querySelector('svg')).toHaveStyle({
      '--button-progress-color': 'var(--color-on-secondary)',
    });
  });

  it('uses logical icon positions while preserving physical aliases', async () => {
    const { rerender } = render(Button, { props: { label: 'Add', icon: iAdd, iconPosition: 'start' } });
    let label = screen.getByText('Add');
    expect(label.previousElementSibling).toHaveAttribute('aria-hidden', 'true');

    await rerender({ label: 'Add', icon: iAdd, iconPosition: 'right' });
    label = screen.getByText('Add');
    expect(label.nextElementSibling).toHaveAttribute('aria-hidden', 'true');
  });

  it('keeps text buttons in their layout box by default', async () => {
    const { rerender } = render(Button, { props: { label: 'Text', variant: 'text', size: 'medium' } });
    expect(screen.getByRole('button').className).not.toContain('-mx-6');

    await rerender({ label: 'Text', variant: 'text', size: 'medium', edgeAligned: true });
    expect(screen.getByRole('button').className).toContain('-mx-6');

    await rerender({ label: 'Text', variant: 'text', size: 'medium', edgeAligned: false });
    expect(screen.getByRole('button').className).not.toContain('-mx-6');
  });

  it('supports intent-based shape feedback', () => {
    render(Button, {
      props: { label: 'Static shape', toggleable: true, defaultPressed: true, shapeFeedback: 'none' },
    });

    const button = screen.getByRole('button');
    expect(button).toHaveStyle({ borderRadius: '40px' });
    expect(button.className).toContain('rounded-[40px]');
  });

  it('provides a durable focus-visible indicator and 48px touch target', () => {
    render(Button, { props: { label: 'Focus' } });
    const button = screen.getByRole('button');

    expect(button.className).toContain('focus-visible:outline-2');
    expect(button.className).toContain('focus-visible:outline-offset-2');
    const touchTarget = button.querySelector('.touch-target');
    expect(touchTarget?.className).toContain('h-12');
    expect(touchTarget?.className).toContain('min-w-12');
  });

  it('keeps the visible custom label in the accessible name', () => {
    render(Fixture, { props: { label: 'Enregistrer', withChildren: true } });

    const button = screen.getByRole('button', { name: 'Supprimer' });
    expect(button).not.toHaveAttribute('aria-label');
  });

  it('requires an explicit accessible name for non-text custom content', () => {
    render(Fixture, { props: { withChildren: true, childrenAriaHidden: true, 'aria-label': 'Save changes' } });

    expect(screen.getByRole('button', { name: 'Save changes' })).toBeVisible();
  });

  it('hides trusted raw SVG icons from the accessibility tree', () => {
    render(Button, { props: { label: 'Add', icon: '<svg viewBox="0 0 24 24"><path d="M0 0" /></svg>' } });

    expect(screen.getByRole('button').querySelector('.icon[aria-hidden="true"]')).not.toBeNull();
  });

  it('has no a11y violations (filled button)', async () => {
    const { container } = render(Button, { props: { label: 'Accessible Button' } });
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no a11y violations (disabled button)', async () => {
    const { container } = render(Button, { props: { label: 'Disabled', disabled: true } });
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no a11y violations (link button)', async () => {
    const { container } = render(Button, { props: { label: 'Link Button', href: 'https://example.com' } });
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no a11y violations (disabled link)', async () => {
    const { container } = render(Button, {
      props: { label: 'Disabled Link', href: 'https://example.com', disabled: true },
    });
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no a11y violations (toggle button)', async () => {
    const { container } = render(Button, { props: { label: 'Toggle', toggleable: true } });
    expect(await axe(container)).toHaveNoViolations();
  });

  it('exposes semantic and external state to classes functions', () => {
    render(Button, {
      props: {
        label: 'X',
        variant: 'tonal',
        toggleable: true,
        defaultPressed: true,
        class: 'extra',
        classes: (state) => ({ button: `v-${state.variant} p-${state.isPressed}` }),
      },
    });
    const button = screen.getByRole('button');
    expect(button.className).toContain('v-tonal');
    expect(button.className).toContain('p-true');
    expect(button.className).toContain('extra');
  });
});
