import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import { axe } from 'jest-axe';
import { iDarkMode } from '@udixio/icons-rounded-400/dark_mode';
import { iLightMode } from '@udixio/icons-rounded-400/light_mode';
import { getSwitchHandleOffset } from '@udixio/core';
import { createSwitchThumbController } from '@udixio/core/dom';
import Switch from './Switch.svelte';
import Fixture from './switch.fixture.svelte';

vi.mock('@udixio/core/dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@udixio/core/dom')>();
  return {
    ...actual,
    createSwitchThumbController: vi.fn(() => ({ update: vi.fn(), destroy: vi.fn() })),
  };
});

describe('Switch', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('renders a named switch with native switch semantics', () => {
    render(Switch, { props: { 'aria-label': 'Wi-Fi' } });

    const toggle = screen.getByRole('switch', { name: 'Wi-Fi' });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    expect(toggle).toHaveAttribute('tabindex', '0');
    expect(toggle.querySelector('.handle-container')).toHaveStyle({
      translate: `${getSwitchHandleOffset(false)}px`,
    });
  });

  it('owns uncontrolled state and emits each accepted transition once', async () => {
    const onCheckedChange = vi.fn();
    render(Switch, { props: { 'aria-label': 'Wi-Fi', defaultChecked: true, onCheckedChange } });
    const toggle = screen.getByRole('switch', { name: 'Wi-Fi' });

    expect(toggle).toHaveAttribute('aria-checked', 'true');
    await fireEvent.click(toggle);
    flushSync();
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    expect(onCheckedChange).toHaveBeenCalledTimes(1);
    expect(onCheckedChange).toHaveBeenCalledWith(false);
  });

  it('requests a controlled change and notifies the owner', async () => {
    const onCheckedChange = vi.fn();
    render(Switch, { props: { 'aria-label': 'Wi-Fi', checked: false, onCheckedChange } });

    await fireEvent.click(screen.getByRole('switch', { name: 'Wi-Fi' }));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('round-trips checked state through bind:', async () => {
    const onCheckedChange = vi.fn();
    const { component } = render(Fixture, {
      props: { 'aria-label': 'Wi-Fi', mode: 'bind', onCheckedChange },
    });

    await fireEvent.click(screen.getByRole('switch', { name: 'Wi-Fi' }));
    flushSync();
    expect(component.readChecked()).toBe(true);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('lets a function binding reject a checked transition', async () => {
    const onCheckedChange = vi.fn();
    const { component } = render(Fixture, {
      props: {
        'aria-label': 'Wi-Fi',
        mode: 'function-binding',
        accept: () => false,
        onCheckedChange,
      },
    });

    await fireEvent.click(screen.getByRole('switch', { name: 'Wi-Fi' }));
    flushSync();
    expect(component.readChecked()).toBe(false);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('toggles with Space and Enter and forwards keyboard callbacks', async () => {
    const onkeydown = vi.fn();
    const onCheckedChange = vi.fn();
    render(Switch, { props: { 'aria-label': 'Wi-Fi', onkeydown, onCheckedChange } });
    const toggle = screen.getByRole('switch', { name: 'Wi-Fi' });

    await fireEvent.keyDown(toggle, { key: ' ' });
    await fireEvent.keyDown(toggle, { key: 'Enter' });
    expect(onkeydown).toHaveBeenCalledTimes(2);
    expect(onCheckedChange).toHaveBeenNthCalledWith(1, true);
    expect(onCheckedChange).toHaveBeenNthCalledWith(2, false);
  });

  it('blocks disabled interaction', async () => {
    const onCheckedChange = vi.fn();
    render(Switch, {
      props: { 'aria-label': 'Wi-Fi', disabled: true, onCheckedChange },
    });
    const toggle = screen.getByRole('switch', { name: 'Wi-Fi' });

    expect(toggle).toHaveAttribute('aria-disabled', 'true');
    expect(toggle).toHaveAttribute('tabindex', '-1');
    await fireEvent.click(toggle);
    await fireEvent.keyDown(toggle, { key: ' ' });
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it('renders the resolved icon and forwards classes and attributes', () => {
    const classes = vi.fn(() => ({ switch: 'consumer-switch' }));
    render(Switch, {
      props: {
        'aria-label': 'Theme',
        defaultChecked: true,
        activeIcon: iLightMode,
        inactiveIcon: iDarkMode,
        class: 'consumer-root',
        classes,
        'data-testid': 'switch',
      },
    });

    const toggle = screen.getByTestId('switch');
    expect(toggle).toHaveClass('consumer-root', 'consumer-switch');
    expect(toggle.querySelector('.icon svg')).toBeInTheDocument();
    expect(classes).toHaveBeenCalledWith(expect.objectContaining({ isChecked: true }));
  });

  it('creates one thumb controller, animates transitions, and destroys it', async () => {
    const controller = { update: vi.fn(), destroy: vi.fn() };
    vi.mocked(createSwitchThumbController).mockReturnValue(controller as never);
    const { unmount } = render(Switch, { props: { 'aria-label': 'Wi-Fi' } });

    expect(createSwitchThumbController).toHaveBeenCalledTimes(1);
    await fireEvent.click(screen.getByRole('switch', { name: 'Wi-Fi' }));
    flushSync();
    expect(controller.update).toHaveBeenCalledWith(
      getSwitchHandleOffset(false),
      getSwitchHandleOffset(true),
    );
    unmount();
    expect(controller.destroy).toHaveBeenCalledTimes(1);
  });

  it('has no automated accessibility violations', async () => {
    const { container } = render(Switch, { props: { 'aria-label': 'Wi-Fi' } });
    expect(await axe(container)).toHaveNoViolations();
  });
});
