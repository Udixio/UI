import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { beforeEach, vi } from 'vitest';
import { Switch } from '../lib/index.js';
import { createSwitchThumbController } from '@udixio/core/dom';

expect.extend(toHaveNoViolations);

// Mocking `animejs` directly (a transitive dependency of `@udixio/core/dom`)
// corrupts the sibling `@udixio/core` entry's exports under Vite's
// dependency pre-bundling in this workspace -- mocking the already-isolated
// `createSwitchThumbController` factory instead avoids that.
vi.mock('@udixio/core/dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@udixio/core/dom')>();
  return {
    ...actual,
    createSwitchThumbController: vi.fn(),
  };
});

function mockController() {
  return { update: vi.fn(), destroy: vi.fn() };
}

describe('Switch', () => {
  beforeEach(() => {
    vi.mocked(createSwitchThumbController).mockReturnValue(mockController());
  });

  it('owns an uncontrolled checked state and emits each accepted transition once', () => {
    const onCheckedChange = vi.fn();
    render(
      <Switch
        aria-label="Wi-Fi"
        defaultChecked
        onCheckedChange={onCheckedChange}
      />,
    );
    const toggle = screen.getByRole('switch', { name: 'Wi-Fi' });

    expect(toggle).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    expect(onCheckedChange).toHaveBeenCalledTimes(1);
    expect(onCheckedChange).toHaveBeenCalledWith(false);
  });

  it('requests controlled changes without mutating the rendered value', () => {
    const onCheckedChange = vi.fn();
    render(
      <Switch
        aria-label="Wi-Fi"
        checked={false}
        onCheckedChange={onCheckedChange}
      />,
    );
    const toggle = screen.getByRole('switch', { name: 'Wi-Fi' });

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('toggles via keyboard with Space and Enter', () => {
    const onCheckedChange = vi.fn();
    render(<Switch aria-label="Wi-Fi" onCheckedChange={onCheckedChange} />);
    const toggle = screen.getByRole('switch', { name: 'Wi-Fi' });

    fireEvent.keyDown(toggle, { key: ' ' });
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    fireEvent.keyDown(toggle, { key: 'Enter' });
    expect(onCheckedChange).toHaveBeenCalledWith(false);
  });

  it('creates the shared thumb controller scoped to the handle container', () => {
    render(<Switch aria-label="Wi-Fi" />);
    const toggle = screen.getByRole('switch', { name: 'Wi-Fi' });
    const handleContainer = toggle.querySelector('.handle-container');

    expect(createSwitchThumbController).toHaveBeenCalledWith({
      root: handleContainer,
    });
  });

  it("calls the thumb controller's update() with the known from/to offsets once per checked change", () => {
    const controller = mockController();
    vi.mocked(createSwitchThumbController).mockReturnValue(controller);
    render(<Switch aria-label="Wi-Fi" />);
    const toggle = screen.getByRole('switch', { name: 'Wi-Fi' });
    controller.update.mockClear();

    fireEvent.click(toggle);
    expect(controller.update).toHaveBeenCalledTimes(1);
    expect(controller.update).toHaveBeenNthCalledWith(1, 0, 20);
    fireEvent.click(toggle);
    expect(controller.update).toHaveBeenCalledTimes(2);
    expect(controller.update).toHaveBeenNthCalledWith(2, 20, 0);
  });

  it('destroys the thumb controller on unmount', () => {
    const controller = mockController();
    vi.mocked(createSwitchThumbController).mockReturnValue(controller);
    const { unmount } = render(<Switch aria-label="Wi-Fi" />);

    unmount();

    expect(controller.destroy).toHaveBeenCalledTimes(1);
  });

  it('blocks disabled interaction', () => {
    const onCheckedChange = vi.fn();
    render(
      <Switch aria-label="Wi-Fi" disabled onCheckedChange={onCheckedChange} />,
    );
    const toggle = screen.getByRole('switch', { name: 'Wi-Fi' });

    expect(toggle).toHaveAttribute('aria-disabled', 'true');
    expect(toggle).toHaveAttribute('tabIndex', '-1');
    fireEvent.click(toggle);
    fireEvent.keyDown(toggle, { key: ' ' });
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it('exposes complete style state and forwards refs', () => {
    const ref = React.createRef<HTMLDivElement>();
    const className = vi.fn(() => ({ switch: 'consumer-switch' }));
    render(<Switch aria-label="Wi-Fi" ref={ref} className={className} />);

    expect(ref.current).toBe(screen.getByRole('switch'));
    expect(ref.current).toHaveClass('consumer-switch');
    expect(className).toHaveBeenCalledWith(
      expect.objectContaining({ isChecked: false }),
    );
  });

  it('renders the resolved icon inside the thumb', () => {
    const activeIcon = '<svg viewBox="0 -960 960 960"><path d="M1" /></svg>';
    const inactiveIcon = '<svg viewBox="0 -960 960 960"><path d="M2" /></svg>';
    render(
      <Switch
        aria-label="Wi-Fi"
        defaultChecked
        activeIcon={activeIcon}
        inactiveIcon={inactiveIcon}
      />,
    );
    const toggle = screen.getByRole('switch', { name: 'Wi-Fi' });
    expect(toggle.querySelector('path[d="M1"]')).not.toBeNull();
    expect(toggle.querySelector('path[d="M2"]')).toBeNull();
  });

  it('has no automated accessibility violations', async () => {
    const view = render(<Switch aria-label="Wi-Fi" />);
    expect(await axe(view.container)).toHaveNoViolations();
  });
});
