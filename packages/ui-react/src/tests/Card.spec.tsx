import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { vi } from 'vitest';
import { Card } from '../lib/index.js';

expect.extend(toHaveNoViolations);

describe('Card', () => {
  it('renders a plain container without action semantics or state layer', () => {
    render(
      <Card data-testid="card">
        <p>Body</p>
      </Card>,
    );

    const card = screen.getByTestId('card');
    expect(card.tagName).toBe('DIV');
    expect(card).not.toHaveAttribute('role');
    expect(card).not.toHaveAttribute('tabindex');
    expect(card.querySelector('.state-layer')).not.toBeInTheDocument();
    expect(card).toHaveClass('border-outline-variant');
    expect(screen.getByText('Body')).toBeInTheDocument();
  });

  it('maps every variant to its container treatment', () => {
    const { rerender } = render(<Card data-testid="card" />);
    expect(screen.getByTestId('card')).toHaveClass('border-outline-variant');

    rerender(<Card data-testid="card" variant="elevated" />);
    expect(screen.getByTestId('card')).toHaveClass('shadow-1');

    rerender(<Card data-testid="card" variant="filled" />);
    expect(screen.getByTestId('card')).toHaveClass(
      'bg-surface-container-highest',
    );
  });

  it('forwards native props and refs', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Card ref={ref} data-testid="card" aria-label="Summary" />);

    expect(ref.current).toBe(screen.getByTestId('card'));
    expect(ref.current).toHaveAttribute('aria-label', 'Summary');
  });

  it('exposes the resolved state to a className function', () => {
    render(
      <Card
        data-testid="card"
        interactive
        className={({ interactive }) => ({
          card: interactive ? 'custom-actionable' : 'custom-static',
        })}
      />,
    );

    expect(screen.getByTestId('card')).toHaveClass('custom-actionable');
  });

  it('renders button semantics, focusability, and a state layer when interactive', () => {
    render(
      <Card interactive>
        <p>Open project</p>
      </Card>,
    );

    const card = screen.getByRole('button', { name: 'Open project' });
    expect(card).toHaveAttribute('tabindex', '0');
    expect(card).toHaveClass('cursor-pointer');
    expect(card.querySelector('.state-layer')).toBeInTheDocument();
  });

  it('lets consumers override interactive semantics', () => {
    render(<Card data-testid="card" interactive role="link" tabIndex={-1} />);

    const card = screen.getByTestId('card');
    expect(card).toHaveAttribute('role', 'link');
    expect(card).toHaveAttribute('tabindex', '-1');
  });

  it('activates an interactive card with Enter and Space like a native button', () => {
    const onClick = vi.fn();
    render(
      <Card interactive onClick={onClick}>
        <p>Open</p>
      </Card>,
    );
    const card = screen.getByRole('button', { name: 'Open' });

    fireEvent.keyDown(card, { key: 'Enter' });
    expect(onClick).toHaveBeenCalledTimes(1);

    const spaceDown = fireEvent.keyDown(card, { key: ' ' });
    expect(spaceDown).toBe(false);
    expect(onClick).toHaveBeenCalledTimes(1);

    fireEvent.keyUp(card, { key: ' ' });
    expect(onClick).toHaveBeenCalledTimes(2);

    fireEvent.keyDown(card, { key: 'a' });
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('respects a consumer key handler that prevents activation', () => {
    const onClick = vi.fn();
    render(
      <Card
        interactive
        onClick={onClick}
        onKeyDown={(event) => event.preventDefault()}
      >
        <p>Open</p>
      </Card>,
    );

    fireEvent.keyDown(screen.getByRole('button', { name: 'Open' }), {
      key: 'Enter',
    });
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders a native link with the interactive treatment when href is set', () => {
    render(
      <Card href="/projects/aurora" target="_blank" rel="noreferrer">
        <p>Project Aurora</p>
      </Card>,
    );

    const link = screen.getByRole('link', { name: 'Project Aurora' });
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/projects/aurora');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noreferrer');
    expect(link).not.toHaveAttribute('role');
    expect(link).toHaveClass('cursor-pointer');
    expect(link.querySelector('.state-layer')).toBeInTheDocument();
  });

  it('has no axe violations across container, interactive, and link renders', async () => {
    const { container } = render(
      <main>
        <Card>
          <p>Static content</p>
        </Card>
        <Card interactive>
          <p>Actionable content</p>
        </Card>
        <Card href="/somewhere">
          <p>Linked content</p>
        </Card>
      </main>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
