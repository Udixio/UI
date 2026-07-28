import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Divider } from '../lib/index.js';

expect.extend(toHaveNoViolations);

describe('Divider', () => {
  it('renders a native hr with the horizontal treatment by default', () => {
    render(<Divider data-testid="divider" />);

    const divider = screen.getByTestId('divider');
    expect(divider.tagName).toBe('HR');
    expect(divider).toHaveClass('border-t');
    expect(divider).not.toHaveAttribute('aria-orientation');
  });

  it('applies the vertical treatment and aria-orientation when requested', () => {
    render(<Divider data-testid="divider" orientation="vertical" />);

    const divider = screen.getByTestId('divider');
    expect(divider).toHaveClass('border-l');
    expect(divider).toHaveAttribute('aria-orientation', 'vertical');
  });

  it('forwards native props and refs', () => {
    const ref = React.createRef<HTMLHRElement>();
    render(<Divider ref={ref} data-testid="divider" aria-label="Section" />);

    expect(ref.current).toBe(screen.getByTestId('divider'));
    expect(ref.current).toHaveAttribute('aria-label', 'Section');
  });

  it('lets consumers override aria-orientation', () => {
    render(
      <Divider
        data-testid="divider"
        orientation="vertical"
        aria-orientation="horizontal"
      />,
    );

    expect(screen.getByTestId('divider')).toHaveAttribute(
      'aria-orientation',
      'horizontal',
    );
  });

  it('exposes the resolved state to a className function', () => {
    render(
      <Divider
        data-testid="divider"
        orientation="vertical"
        className={({ orientation }) => ({
          divider:
            orientation === 'vertical'
              ? 'custom-vertical'
              : 'custom-horizontal',
        })}
      />,
    );

    expect(screen.getByTestId('divider')).toHaveClass('custom-vertical');
  });

  it('has no axe violations in either orientation', async () => {
    const { container } = render(
      <main>
        <Divider />
        <Divider orientation="vertical" />
      </main>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
