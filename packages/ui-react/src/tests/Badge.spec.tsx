import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import { Badge } from '../lib/index.js';

expect.extend(toHaveNoViolations);

const badgeOf = (root: HTMLElement) =>
  root.querySelector('span > span') as HTMLElement;

// The badge now holds two texts: the visible label, and the visually hidden
// sentence the live region announces. Assertions on one must not see the other.
const visibleTextOf = (root: HTMLElement) =>
  (root.querySelector('[aria-hidden="true"]')?.textContent ?? '').trim();

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
    expect(visibleTextOf(container)).toBe('');
    // Material's small badge is 6dp square; the large one is 16dp tall.
    expect(badge.className).toContain('size-1.5');
    expect(badge.className).not.toContain('h-4');
  });

  it('renders the large pill as soon as there is a label', () => {
    const { container } = render(<Badge label={3} description="3 unread" />);

    const badge = badgeOf(container);
    expect(visibleTextOf(container)).toBe('3');
    expect(badge.className).toContain('h-4');
    expect(badge.className).not.toContain('size-1.5');
  });

  it('caps a count the way Material spells it', () => {
    const { container } = render(
      <Badge label={100} max={99} description="99+ unread" />,
    );

    expect(visibleTextOf(container)).toBe('99+');
  });

  it('shows a zero count rather than treating it as absent', () => {
    const { container } = render(<Badge label={0} description="No unread" />);

    expect(visibleTextOf(container)).toBe('0');
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

  // `status` does not take its name from its contents, so an `aria-label` was
  // the only thing naming it -- and naming a live region is not what makes it
  // announce. Duplicating the sentence into both would risk it being read
  // twice, so the content alone carries it.
  it('names the live region by its content rather than an aria-label', () => {
    const { container } = render(
      <Badge label={3} description="3 unread messages" />,
    );

    const live = screen.getByRole('status');
    expect(live).not.toHaveAttribute('aria-label');
    expect(live.textContent).toContain('3 unread messages');
    expect(visibleTextOf(container)).toBe('3');
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

  // The contract says nothing truncates, and a `max-w` with `truncate` broke
  // that in the browser before it broke any test: `999+` rendered as `99...`,
  // one pixel over Material's 34dp, which is stated for their font not ours.
  it('never clamps or truncates its label', () => {
    const { container } = render(
      <Badge label={999} max={999} description="999 unread" />,
    );

    const badge = badgeOf(container);
    expect(visibleTextOf(container)).toBe('999');
    expect(badge.className).not.toContain('max-w-');
    expect(badge.querySelector('span')?.className).not.toContain('truncate');
  });

  it('keeps a long label whole rather than cutting it', () => {
    const { container } = render(
      <Badge label="BETA RELEASE" description="Beta release" />,
    );

    expect(visibleTextOf(container)).toBe('BETA RELEASE');
  });

  // `role="status"` is a live region, and screen readers announce the CONTENT
  // that changed, not the element's `aria-label`. With the description living
  // only in the label, a count going 3 -> 4 announced "4" -- which is the very
  // thing Material asks a badge to avoid, since the number alone says nothing.
  it('carries the description as live-region content, not only as a label', () => {
    render(<Badge label={3} description="3 unread messages" />);

    const live = screen.getByRole('status');
    expect(live.textContent).toContain('3 unread messages');
  });

  it('hides the visible digit from assistive tech, so it is not read twice', () => {
    const { container } = render(<Badge label={3} description="3 unread messages" />);

    const visible = container.querySelector('[aria-hidden="true"]');
    expect(visible?.textContent).toBe('3');
    expect(screen.getByRole('status')).toHaveTextContent('3 unread messages');
  });

  it('announces the small dot, which has no visible text at all', () => {
    render(<Badge description="You have unread messages" />);

    expect(screen.getByRole('status').textContent).toContain(
      'You have unread messages',
    );
  });

  it('applies a caller class to the element the string form targets', () => {
    const { container } = render(
      <Badge label={3} description="3 unread" className="mt-4" />,
    );

    expect(container.firstElementChild?.className).toContain('mt-4');
  });

  it('applies element classes through the state-aware form', () => {
    const { container } = render(
      <Badge
        label={3}
        description="3 unread"
        className={() => ({ badge: 'ring-2' })}
      />,
    );

    expect(badgeOf(container).className).toContain('ring-2');
  });
});
