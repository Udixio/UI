import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { vi } from 'vitest';
import { Checkbox } from '../lib/index.js';

expect.extend(toHaveNoViolations);

const NamedCheckbox = (props: React.ComponentProps<typeof Checkbox>) => (
  <>
    <Checkbox id="updates" {...props} />
    <label htmlFor="updates">Product updates</label>
  </>
);

describe('Checkbox', () => {
  it('owns an uncontrolled checked state and emits each accepted transition once', () => {
    const onCheckedChange = vi.fn();
    render(<NamedCheckbox defaultChecked onCheckedChange={onCheckedChange} />);
    const checkbox = screen.getByRole('checkbox', { name: 'Product updates' });

    expect(checkbox).toBeChecked();
    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
    expect(onCheckedChange).toHaveBeenCalledTimes(1);
    expect(onCheckedChange).toHaveBeenCalledWith(false);
  });

  it('requests controlled changes without mutating the rendered value', () => {
    const onCheckedChange = vi.fn();
    render(<NamedCheckbox checked={false} onCheckedChange={onCheckedChange} />);
    const checkbox = screen.getByRole('checkbox', { name: 'Product updates' });

    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('blocks disabled interaction and exposes invalid state', () => {
    const onCheckedChange = vi.fn();
    render(
      <NamedCheckbox disabled invalid onCheckedChange={onCheckedChange} />,
    );
    const checkbox = screen.getByRole('checkbox', { name: 'Product updates' });

    expect(checkbox).toBeDisabled();
    expect(checkbox).toHaveAttribute('aria-invalid', 'true');
    fireEvent.click(checkbox);
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it('uses native mixed semantics for an indeterminate checkbox', () => {
    render(<NamedCheckbox indeterminate />);
    const checkbox = screen.getByRole('checkbox', {
      name: 'Product updates',
    }) as HTMLInputElement;

    expect(checkbox.indeterminate).toBe(true);
  });

  it('forwards input attributes, refs, and complete style state', () => {
    const ref = React.createRef<HTMLInputElement>();
    const className = vi.fn(() => ({ checkbox: 'consumer-checkbox' }));
    render(
      <NamedCheckbox ref={ref} required name="updates" className={className} />,
    );

    expect(ref.current).toBe(screen.getByRole('checkbox'));
    expect(ref.current).toBeRequired();
    expect(ref.current).toHaveAttribute('name', 'updates');
    expect(ref.current?.parentElement).toHaveClass('consumer-checkbox');
    expect(className).toHaveBeenCalledWith(
      expect.objectContaining({ isChecked: false, isFocused: false }),
    );
  });

  it('exposes focus changes to state-aware classes', () => {
    const className = vi.fn(() => ({}));
    render(<NamedCheckbox className={className} />);
    const checkbox = screen.getByRole('checkbox');

    fireEvent.focus(checkbox);
    expect(className).toHaveBeenLastCalledWith(
      expect.objectContaining({ isFocused: true }),
    );
    fireEvent.blur(checkbox);
    expect(className).toHaveBeenLastCalledWith(
      expect.objectContaining({ isFocused: false }),
    );
  });

  it('renders the shared Udixio asset with the same single icon container as Angular', () => {
    render(<NamedCheckbox defaultChecked />);
    const checkbox = screen.getByRole('checkbox');
    const icon = checkbox.parentElement?.querySelector(
      'div[aria-hidden="true"] svg',
    );

    expect(icon).toHaveAttribute('viewBox', '0 -960 960 960');
    expect(icon).toHaveAttribute('width', '100%');
    expect(icon).toHaveAttribute('height', '100%');
    expect(icon?.parentElement).toHaveClass('icon', 'size-4');
    expect(icon?.parentElement?.parentElement).toBe(checkbox.parentElement);
  });

  it('has no automated accessibility violations and keeps the checkbox out of aria-hidden content', async () => {
    const view = render(<NamedCheckbox />);
    const checkbox = screen.getByRole('checkbox', { name: 'Product updates' });

    expect(checkbox.closest('[aria-hidden="true"]')).toBeNull();
    expect(await axe(view.container)).toHaveNoViolations();
  });
});
