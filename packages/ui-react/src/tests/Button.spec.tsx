import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { Button } from '../lib/index.js';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
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
    render(<Button label="Test Button" icon={faPlus} />);

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
    // Verify the label is visually hidden (invisible class) during loading
    const label = screen.getByText('Test Button');
    expect(label).toBeInTheDocument();
    expect(button?.querySelector('svg')).toHaveStyle({
      stroke: 'var(--color-on-primary)',
    });
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
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // @ts-expect-error — intentionally testing missing required prop
    const { container } = render(<Button />);

    expect(container.innerHTML).toBe('');
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('requires either a `label` prop'),
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
