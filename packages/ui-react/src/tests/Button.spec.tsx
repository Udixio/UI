import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { Button } from '../lib/index.js';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { iAdd } from '@udixio/icons-rounded-400/add';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Button', () => {
  it('renders correctly with default props', () => {
    render(<Button label="Test Button" />);

    const button = screen.getByText('Test Button');
    expect(button).toBeInTheDocument();
    expect(
      button.closest('button')?.querySelector('.touch-target'),
    ).not.toBeNull();
    expect(
      button.closest('button')?.querySelector('.state-layer'),
    ).not.toBeNull();
    expect(button.closest('button')).toHaveStyle({ borderRadius: '40px' });
    expect(button.closest('button')).not.toHaveStyle({ transition: '0.3s' });
    expect(button.closest('button')?.className).not.toContain('active:rounded');
    expect(
      button.closest('button')?.querySelector<HTMLElement>('.state-layer'),
    ).toHaveStyle({ borderRadius: 'inherit' });
  });

  it('disables the button when disabled prop is true', () => {
    render(<Button label="Test Button" disabled />);

    const button = screen.getByText('Test Button').closest('button');
    expect(button).toBeDisabled();
  });

  it('calls onClick handler when clicked', () => {
    const handleClick = vi.fn();
    render(<Button label="Test Button" onClick={handleClick} />);

    const button = screen.getByText('Test Button');
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick handler when disabled', () => {
    const handleClick = vi.fn();
    render(<Button label="Test Button" onClick={handleClick} disabled />);

    const button = screen.getByText('Test Button');
    fireEvent.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders with an icon when icon prop is provided', () => {
    render(<Button label="Test Button" icon={iAdd} />);

    const button = screen.getByText('Test Button').closest('button');
    expect(button).toBeInTheDocument();
    // Verify SVG icon is rendered inside the button
    const svg = button?.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders as an anchor tag when href is provided', () => {
    render(<Button label="Test Button" href="https://example.com" />);

    const link = screen.getByText('Test Button').closest('a');
    expect(link).toHaveAttribute('href', 'https://example.com');
  });

  it('shows loading indicator when loading prop is true', () => {
    const { container } = render(<Button label="Test Button" loading />);

    const button = container.querySelector('button');
    expect(button).toBeInTheDocument();
    const label = screen.getByText('Test Button');
    expect(label).toBeInTheDocument();
    expect(label.className).toContain('opacity-0');
    expect(label.className).not.toContain('invisible');
    expect(screen.getByRole('button', { name: 'Test Button' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
    const svg = button?.querySelector('svg');
    expect(svg).toHaveStyle({
      '--button-progress-color': 'var(--color-on-primary)',
    });
    // Regression: the circle carries its own `stroke-primary` class, which
    // wins over an inherited `stroke` set on the parent `svg` — the color
    // must be forced on the circle itself via `!stroke-[var(...)]`.
    expect(svg?.querySelector('circle')?.getAttribute('class')).toContain(
      '!stroke-[var(--button-progress-color)]',
    );
  });

  it('blocks action events while loading', () => {
    const onClick = vi.fn();
    render(<Button label="Saving" loading onClick={onClick} />);

    fireEvent.click(screen.getByRole('button', { name: 'Saving' }));

    expect(onClick).not.toHaveBeenCalled();
  });

  it('uses blocked interaction styling while loading', () => {
    render(<Button label="Saving" loading />);

    const button = screen.getByRole('button', { name: 'Saving' });
    expect(button.className).toContain('cursor-default');
    expect(button.className).not.toContain('hover:shadow-1');
  });

  it.each(['Enter', ' '])('preserves native %s keyboard activation', (key) => {
    const onClick = vi.fn();
    render(<Button label="Keyboard action" onClick={onClick} />);

    const button = screen.getByRole('button', { name: 'Keyboard action' });
    const keyEvent = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
    });
    expect(button.dispatchEvent(keyEvent)).toBe(true);

    // Browsers dispatch the click after the native button key sequence.
    button.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('connects pointer feedback and removes it during cleanup', () => {
    const { unmount } = render(<Button label="Pointer action" />);
    const button = screen.getByRole('button', { name: 'Pointer action' });

    fireEvent.pointerDown(button, {
      pointerType: 'mouse',
      clientX: 4,
      clientY: 4,
    });
    const ripple = button.querySelector('[data-udixio-ripple]');
    expect(ripple).not.toBeNull();

    unmount();
    expect(ripple?.isConnected).toBe(false);
  });

  // ─── Sprint 1: type attribute ─────────────────────────────────

  it('renders with type="button" by default to prevent form submission', () => {
    render(<Button label="Test" />);

    const button = screen.getByText('Test').closest('button');
    expect(button).toHaveAttribute('type', 'button');
  });

  it('allows overriding the type attribute', () => {
    render(<Button label="Submit" type="submit" />);

    const button = screen.getByText('Submit').closest('button');
    expect(button).toHaveAttribute('type', 'submit');
  });

  it('does not pass type attribute to anchor elements', () => {
    render(<Button label="Link" href="https://example.com" />);

    const link = screen.getByText('Link').closest('a');
    expect(link).not.toHaveAttribute('type');
  });

  it('forwards native current-page semantics to links', () => {
    render(<Button label="Current page" href="/current" aria-current="page" />);

    expect(screen.getByRole('link', { name: 'Current page' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  // ─── Sprint 1: disabled link a11y ─────────────────────────────

  it('makes disabled links inert with aria-disabled and tabIndex', () => {
    render(
      <Button label="Disabled Link" href="https://example.com" disabled />,
    );

    const link = screen.getByText('Disabled Link').closest('a');
    expect(link).toHaveAttribute('aria-disabled', 'true');
    expect(link).toHaveAttribute('tabindex', '-1');
    expect(link).toHaveAttribute('role', 'link');
    // href should NOT be present on disabled links
    expect(link).not.toHaveAttribute('href');
  });

  it('does not call onClick on disabled links', () => {
    const handleClick = vi.fn();
    render(
      <Button
        label="Disabled Link"
        href="https://example.com"
        disabled
        onClick={handleClick}
      />,
    );

    const link = screen.getByText('Disabled Link').closest('a');
    fireEvent.click(link!);

    expect(handleClick).not.toHaveBeenCalled();
  });

  // ─── Sprint 1: graceful handling without label ────────────────

  it('renders null and logs error when no label or children provided', () => {
    const errorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    // @ts-expect-error — intentionally testing missing required prop
    const { container } = render(<Button />);

    expect(container.innerHTML).toBe('');
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('requires one non-empty `label`'),
    );

    errorSpy.mockRestore();
  });

  // ─── Shared controlled/uncontrolled state contract ───────────

  it('sets aria-pressed on toggle buttons', () => {
    render(<Button label="Toggle" toggleable />);

    const button = screen.getByText('Toggle').closest('button');
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  it('owns state initialized by defaultPressed in uncontrolled mode', () => {
    const onPressedChange = vi.fn();
    render(
      <Button
        label="Toggle"
        toggleable
        defaultPressed
        onPressedChange={onPressedChange}
      />,
    );

    const button = screen.getByText('Toggle').closest('button');
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button).toHaveStyle({ borderRadius: '16px' });
    expect(button?.className).toContain('rounded-[16px]');
    expect(button?.className).not.toContain('rounded-[40px]');

    fireEvent.click(button!);
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(onPressedChange).toHaveBeenCalledWith(false);
  });

  it('requests controlled changes without mutating the owned value', () => {
    const onPressedChange = vi.fn();
    const { rerender } = render(
      <Button
        label="Toggle"
        toggleable
        pressed={false}
        onPressedChange={onPressedChange}
      />,
    );

    const button = screen.getByText('Toggle').closest('button');
    fireEvent.click(button!);

    expect(onPressedChange).toHaveBeenCalledWith(true);
    expect(button).toHaveAttribute('aria-pressed', 'false');

    rerender(
      <Button
        label="Toggle"
        toggleable
        pressed
        onPressedChange={onPressedChange}
      />,
    );
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('keeps action and pressed-change events independent', () => {
    const onClick = vi.fn();
    const onPressedChange = vi.fn();
    render(
      <Button
        label="Toggle"
        toggleable
        onClick={onClick}
        onPressedChange={onPressedChange}
      />,
    );

    fireEvent.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onPressedChange).toHaveBeenCalledWith(true);
  });

  it('keeps navigation links out of toggle-button semantics', () => {
    const onClick = vi.fn();
    const onPressedChange = vi.fn();
    render(
      <Button
        label="Destination"
        href="/destination"
        toggleable
        defaultPressed
        onClick={onClick}
        onPressedChange={onPressedChange}
      />,
    );

    const link = screen.getByRole('link', { name: 'Destination' });
    expect(link).not.toHaveAttribute('aria-pressed');
    expect(link.className).toContain('bg-primary');

    fireEvent.click(link);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onPressedChange).not.toHaveBeenCalled();
  });

  it.each(['disabled', 'loading'] as const)(
    'blocks pressed changes while %s',
    (blockedProp) => {
      const onPressedChange = vi.fn();
      render(
        <Button
          label="Toggle"
          toggleable
          onPressedChange={onPressedChange}
          {...{ [blockedProp]: true }}
        />,
      );

      fireEvent.click(screen.getByRole('button'));

      expect(onPressedChange).not.toHaveBeenCalled();
    },
  );

  it('normalizes variant aliases through the shared core behavior', () => {
    render(<Button label="Secondary" variant="secondary" />);

    expect(screen.getByRole('button').className).toContain(
      'bg-secondary-container',
    );
  });

  it('uses the semantic content color for toggle loading indicators', () => {
    render(
      <Button
        label="Toggle"
        variant="tonal"
        toggleable
        defaultPressed
        loading
      />,
    );

    expect(screen.getByRole('button').querySelector('svg')).toHaveStyle({
      '--button-progress-color': 'var(--color-on-secondary)',
    });
  });

  it('uses logical icon positions while preserving physical aliases', () => {
    const { rerender } = render(
      <Button label="Add" icon={iAdd} iconPosition="start" />,
    );
    let label = screen.getByText('Add');
    expect(label.previousElementSibling).toHaveAttribute('aria-hidden', 'true');

    rerender(<Button label="Add" icon={iAdd} iconPosition="right" />);
    label = screen.getByText('Add');
    expect(label.nextElementSibling).toHaveAttribute('aria-hidden', 'true');
  });

  it('aligns text buttons to the surrounding edge by default', () => {
    const { rerender } = render(
      <Button label="Text" variant="text" size="medium" />,
    );
    expect(screen.getByRole('button').className).toContain('-mx-6');

    rerender(
      <Button label="Text" variant="text" size="medium" edgeAligned={false} />,
    );
    expect(screen.getByRole('button').className).not.toContain('-mx-6');
  });

  it('supports intent-based shape feedback', () => {
    render(
      <Button
        label="Static shape"
        toggleable
        defaultPressed
        shapeFeedback="none"
      />,
    );

    const button = screen.getByRole('button');
    expect(button).toHaveStyle({ borderRadius: '40px' });
    expect(button.className).toContain('rounded-[40px]');
  });

  it('provides a durable focus-visible indicator and 48px touch target', () => {
    render(<Button label="Focus" />);
    const button = screen.getByRole('button');

    expect(button.className).toContain('focus-visible:outline-2');
    expect(button.className).toContain('focus-visible:outline-offset-2');
    const touchTarget = button.querySelector('.touch-target');
    expect(touchTarget?.className).toContain('h-12');
    expect(touchTarget?.className).toContain('min-w-12');
  });

  it('keeps the visible custom label in the accessible name', () => {
    render(
      // @ts-expect-error — the major API forbids competing content sources.
      <Button label="Enregistrer">
        <span>Supprimer</span>
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Supprimer' });
    expect(button).not.toHaveAttribute('aria-label');
  });

  it('requires an explicit accessible name for non-text custom content', () => {
    render(
      <Button aria-label="Save changes">
        <span aria-hidden="true">✓</span>
      </Button>,
    );

    expect(screen.getByRole('button', { name: 'Save changes' })).toBeVisible();
  });

  it('hides trusted raw SVG icons from the accessibility tree', () => {
    render(
      <Button
        label="Add"
        icon={'<svg viewBox="0 0 24 24"><path d="M0 0" /></svg>'}
      />,
    );

    expect(
      screen.getByRole('button').querySelector('.icon[aria-hidden="true"]'),
    ).not.toBeNull();
  });

  // ─── Sprint 1: axe-core a11y audit ───────────────────────────

  it('has no a11y violations (filled button)', async () => {
    const { container } = render(<Button label="Accessible Button" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no a11y violations (disabled button)', async () => {
    const { container } = render(<Button label="Disabled" disabled />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no a11y violations (link button)', async () => {
    const { container } = render(
      <Button label="Link Button" href="https://example.com" />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no a11y violations (disabled link)', async () => {
    const { container } = render(
      <Button label="Disabled Link" href="https://example.com" disabled />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no a11y violations (toggle button)', async () => {
    const { container } = render(<Button label="Toggle" toggleable />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('exposes semantic and external state to className functions', () => {
    render(
      <Button
        label="X"
        variant="tonal"
        toggleable
        defaultPressed
        className={(state) => ({
          button: `v-${state.variant} p-${state.isPressed}`,
        })}
      />,
    );
    const button = screen.getByRole('button');
    expect(button.className).toContain('v-tonal');
    expect(button.className).toContain('p-true');
  });
});
