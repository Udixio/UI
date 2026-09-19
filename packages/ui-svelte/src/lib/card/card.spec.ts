import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { axe } from 'jest-axe';
import Card from './Card.svelte';
import Fixture from './card.fixture.svelte';

describe('Card', () => {
  it('renders a plain container without action semantics or state layer', () => {
    render(Fixture, { props: { 'data-testid': 'card' } });

    const card = screen.getByTestId('card');
    expect(card.tagName).toBe('DIV');
    expect(card).not.toHaveAttribute('role');
    expect(card).not.toHaveAttribute('tabindex');
    expect(card.querySelector('.state-layer')).not.toBeInTheDocument();
    expect(card).toHaveClass('border-outline-variant');
    expect(screen.getByText('Body')).toBeInTheDocument();
  });

  it('maps every variant to its container treatment', async () => {
    const { rerender } = render(Card, { props: { 'data-testid': 'card' } });
    expect(screen.getByTestId('card')).toHaveClass('border-outline-variant');

    await rerender({ 'data-testid': 'card', variant: 'elevated' });
    expect(screen.getByTestId('card')).toHaveClass('shadow-1');

    await rerender({ 'data-testid': 'card', variant: 'filled' });
    expect(screen.getByTestId('card')).toHaveClass('bg-surface-container-highest');
  });

  it('forwards native attributes', () => {
    render(Card, { props: { 'data-testid': 'card', 'aria-label': 'Summary' } });

    expect(screen.getByTestId('card')).toHaveAttribute('aria-label', 'Summary');
  });

  it('exposes the resolved state to a classes function and merges class', () => {
    render(Card, {
      props: {
        'data-testid': 'card',
        interactive: true,
        class: 'h-40',
        classes: ({ interactive }) => ({ card: interactive ? 'custom-actionable' : 'custom-static' }),
      },
    });

    expect(screen.getByTestId('card')).toHaveClass('custom-actionable');
    expect(screen.getByTestId('card')).toHaveClass('h-40');
  });

  it('renders button semantics, focusability, and a state layer when interactive', () => {
    render(Fixture, { props: { interactive: true, text: 'Open project' } });

    const card = screen.getByRole('button', { name: 'Open project' });
    expect(card).toHaveAttribute('tabindex', '0');
    expect(card).toHaveClass('cursor-pointer');
    expect(card.querySelector('.state-layer')).toBeInTheDocument();
  });

  it('lets consumers override interactive semantics', () => {
    render(Card, { props: { 'data-testid': 'card', interactive: true, role: 'link', tabindex: -1 } });

    const card = screen.getByTestId('card');
    expect(card).toHaveAttribute('role', 'link');
    expect(card).toHaveAttribute('tabindex', '-1');
  });

  it('activates an interactive card with Enter and Space like a native button', async () => {
    const onclick = vi.fn();
    render(Fixture, { props: { interactive: true, onclick, text: 'Open' } });
    const card = screen.getByRole('button', { name: 'Open' });

    await fireEvent.keyDown(card, { key: 'Enter' });
    expect(onclick).toHaveBeenCalledTimes(1);

    const spaceDown = await fireEvent.keyDown(card, { key: ' ' });
    expect(spaceDown).toBe(false);
    expect(onclick).toHaveBeenCalledTimes(1);

    await fireEvent.keyUp(card, { key: ' ' });
    expect(onclick).toHaveBeenCalledTimes(2);

    await fireEvent.keyDown(card, { key: 'a' });
    expect(onclick).toHaveBeenCalledTimes(2);
  });

  it('respects a consumer key handler that prevents activation', async () => {
    const onclick = vi.fn();
    render(Fixture, {
      props: { interactive: true, onclick, text: 'Open', onkeydown: (event) => event.preventDefault() },
    });

    await fireEvent.keyDown(screen.getByRole('button', { name: 'Open' }), { key: 'Enter' });
    expect(onclick).not.toHaveBeenCalled();
  });

  it('renders a native link with the interactive treatment when href is set', () => {
    render(Fixture, {
      props: { href: '/projects/aurora', target: '_blank', rel: 'noreferrer', text: 'Project Aurora' },
    });

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
    const { container } = render(Fixture, { props: { text: 'Static content' } });
    render(Fixture, { props: { interactive: true, text: 'Actionable content' } });
    render(Fixture, { props: { href: '/somewhere', text: 'Linked content' } });

    expect(await axe(container)).toHaveNoViolations();
  });
});
