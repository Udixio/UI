import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import { Badge } from '../lib/index.js';

expect.extend(toHaveNoViolations);

const badgeOf = (root: HTMLElement) =>
  root.querySelector('span > span') as HTMLElement;

describe('Badge', () => {
  it('wraps what it marks, so the anchor needs no positioning of its own', () => {
    const { container } = render(
      <Badge description="3 unread">
        <i data-testid="icon" />
      </Badge>,
    );

    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(container.firstElementChild?.className).toContain('relative');
  });

  it('renders the small dot when there is nothing to show', () => {
    const { container } = render(<Badge description="Unread" />);

    const badge = badgeOf(container);
    expect(badge.textContent).toBe('');
    // Material's small badge is 6dp square; the large one is 16dp tall.
    expect(badge.className).toContain('size-1.5');
    expect(badge.className).not.toContain('h-4');
  });

  it('renders the large pill as soon as there is a label', () => {
    const { container } = render(<Badge label={3} description="3 unread" />);

    const badge = badgeOf(container);
    expect(badge.textContent).toBe('3');
    expect(badge.className).toContain('h-4');
    expect(badge.className).not.toContain('size-1.5');
  });

  it('caps a count the way Material spells it', () => {
    const { container } = render(
      <Badge label={100} max={99} description="99+ unread" />,
    );

    expect(badgeOf(container).textContent).toBe('99+');
  });

  it('shows a zero count rather than treating it as absent', () => {
    const { container } = render(<Badge label={0} description="No unread" />);

    expect(badgeOf(container).textContent).toBe('0');
    expect(badgeOf(container).className).toContain('h-4');
  });

  it('anchors to the leading edge so a widening count does not move it', () => {
    const { container } = render(<Badge label={1} description="1 unread" />);
    const { container: wide } = render(
      <Badge label={999} description="999 unread" />,
    );

    // Both are pinned by the same logical start offset; only the width grows.
    expect(badgeOf(container).className).toContain('start-[calc(100%-12px)]');
    expect(badgeOf(wide).className).toContain('start-[calc(100%-12px)]');
  });

  it('uses logical offsets, which is what flips it for right-to-left', () => {
    const { container } = render(<Badge label={3} description="3 unread" />);

    const badge = badgeOf(container).className;
    expect(badge).toContain('start-[');
    expect(badge).not.toContain('left-[');
    expect(badge).not.toContain('right-[');
  });

  it('announces the meaning, not the bare digit', () => {
    render(<Badge label={3} description="3 unread messages" />);

    expect(screen.getByRole('status')).toHaveAccessibleName('3 unread messages');
  });

  // A bare "3", or an empty dot, is noise in a screen reader. Without a
  // description there is nothing meaningful to announce, so it says nothing.
  it('hides itself from assistive tech when it has no description', () => {
    const { container } = render(<Badge label={3} />);

    expect(screen.queryByRole('status')).toBeNull();
    expect(badgeOf(container)).toHaveAttribute('aria-hidden', 'true');
  });

  it('uses the error colour roles Material mandates', () => {
    const { container } = render(<Badge label={3} description="3 unread" />);

    const badge = badgeOf(container).className;
    expect(badge).toContain('bg-error');
    expect(badge).toContain('text-on-error');
  });

  it('has no automated accessibility violations', async () => {
    const { container } = render(
      <Badge label={3} description="3 unread messages">
        <button>Inbox</button>
      </Badge>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
