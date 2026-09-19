import { afterEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import { axe } from 'jest-axe';
import Checkbox from './Checkbox.svelte';
import Fixture from './checkbox.fixture.svelte';

describe('Checkbox', () => {
  afterEach(() => cleanup());

  it('renders a native, named checkbox with a generated id', () => {
    render(Checkbox, { props: { 'aria-label': 'Product updates' } });

    const checkbox = screen.getByRole('checkbox', { name: 'Product updates' });
    expect(checkbox).toHaveAttribute('type', 'checkbox');
    expect(checkbox.id).toMatch(/^checkbox-/);
    expect(checkbox.closest('.checkbox')).toBeInTheDocument();
  });

  it('owns an uncontrolled checked state and emits each accepted transition once', async () => {
    const onCheckedChange = vi.fn();
    render(Checkbox, {
      props: { 'aria-label': 'Product updates', defaultChecked: true, onCheckedChange },
    });
    const checkbox = screen.getByRole('checkbox', { name: 'Product updates' });

    expect(checkbox).toBeChecked();
    await fireEvent.click(checkbox);
    flushSync();
    expect(checkbox).not.toBeChecked();
    expect(onCheckedChange).toHaveBeenCalledTimes(1);
    expect(onCheckedChange).toHaveBeenCalledWith(false);
  });

  it('requests a controlled change and notifies the owner', async () => {
    const onCheckedChange = vi.fn();
    render(Checkbox, {
      props: { 'aria-label': 'Product updates', checked: false, onCheckedChange },
    });
    const checkbox = screen.getByRole('checkbox', { name: 'Product updates' });

    await fireEvent.click(checkbox);
    flushSync();
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('round-trips the checked value through bind:', async () => {
    const onCheckedChange = vi.fn();
    const { component } = render(Fixture, {
      props: {
        'aria-label': 'Product updates',
        mode: 'bind',
        onCheckedChange,
      },
    });
    const checkbox = screen.getByRole('checkbox', { name: 'Product updates' });

    await fireEvent.click(checkbox);
    flushSync();
    expect(checkbox).toBeChecked();
    expect(component.readChecked()).toBe(true);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('lets a function binding reject a checked transition', async () => {
    const onCheckedChange = vi.fn();
    const { component } = render(Fixture, {
      props: {
        'aria-label': 'Product updates',
        mode: 'function-binding',
        accept: () => false,
        onCheckedChange,
      },
    });
    const checkbox = screen.getByRole('checkbox', { name: 'Product updates' });

    await fireEvent.click(checkbox);
    flushSync();
    expect(checkbox).not.toBeChecked();
    expect(component.readChecked()).toBe(false);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('blocks disabled interaction and exposes invalid state', async () => {
    const onCheckedChange = vi.fn();
    render(Checkbox, {
      props: {
        'aria-label': 'Product updates',
        disabled: true,
        invalid: true,
        onCheckedChange,
      },
    });
    const checkbox = screen.getByRole('checkbox', { name: 'Product updates' });

    expect(checkbox).toBeDisabled();
    expect(checkbox).toHaveAttribute('aria-invalid', 'true');
    await fireEvent.click(checkbox);
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it('keeps native mixed state and renders the minus icon', () => {
    render(Checkbox, { props: { 'aria-label': 'Notifications', indeterminate: true } });

    const checkbox = screen.getByRole('checkbox', { name: 'Notifications' }) as HTMLInputElement;
    expect(checkbox.indeterminate).toBe(true);
    expect(checkbox.parentElement?.querySelector('.icon svg')).toBeInTheDocument();
    expect(checkbox.closest('[aria-hidden="true"]')).toBeNull();
  });

  it('forwards input attributes, root style, classes, and focus state', async () => {
    const classes = vi.fn(() => ({ checkbox: 'consumer-checkbox' }));
    const onfocus = vi.fn();
    const onblur = vi.fn();
    render(Checkbox, {
      props: {
        id: 'updates',
        'aria-label': 'Product updates',
        'aria-describedby': 'description',
        name: 'updates',
        value: 'accepted',
        required: true,
        class: 'consumer-root',
        style: 'margin-inline: 4px',
        classes,
        onfocus,
        onblur,
        'data-testid': 'checkbox',
      },
    });

    const checkbox = screen.getByTestId('checkbox');
    const root = checkbox.parentElement;
    expect(checkbox).toHaveAttribute('id', 'updates');
    expect(checkbox).toHaveAttribute('name', 'updates');
    expect(checkbox).toHaveAttribute('value', 'accepted');
    expect(checkbox).toBeRequired();
    expect(checkbox).toHaveAttribute('aria-describedby', 'description');
    expect(root).toHaveClass('consumer-root', 'consumer-checkbox');
    expect(root).toHaveAttribute('style', 'margin-inline: 4px;');

    await fireEvent.focus(checkbox);
    await fireEvent.blur(checkbox);
    expect(onfocus).toHaveBeenCalledTimes(1);
    expect(onblur).toHaveBeenCalledTimes(1);
    expect(classes).toHaveBeenLastCalledWith(expect.objectContaining({ isFocused: false }));
  });

  it('connects pointer feedback and cleans it up', async () => {
    const { unmount } = render(Checkbox, { props: { 'aria-label': 'Updates' } });
    const checkbox = screen.getByRole('checkbox', { name: 'Updates' });
    const root = checkbox.parentElement;

    await fireEvent.pointerDown(checkbox, { pointerType: 'mouse', clientX: 4, clientY: 4 });
    const ripple = root?.querySelector('[data-udixio-ripple]');
    expect(ripple).not.toBeNull();
    unmount();
    expect(ripple?.isConnected).toBe(false);
  });

  it('has no automated accessibility violations', async () => {
    const { container } = render(Checkbox, { props: { 'aria-label': 'Product updates' } });
    expect(await axe(container)).toHaveNoViolations();
  });
});
