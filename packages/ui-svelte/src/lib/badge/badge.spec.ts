import { beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import { axe } from 'jest-axe';
import { createBadgeTransitionController } from '@udixio/core/dom';
import Badge from './Badge.svelte';
import Fixture from './badge.fixture.svelte';

vi.mock('@udixio/core/dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@udixio/core/dom')>();
  return { ...actual, createBadgeTransitionController: vi.fn() };
});

const mockTransitionController = () => ({
  setVisible: vi.fn(),
  destroy: vi.fn(),
});

beforeEach(() => {
  vi.mocked(createBadgeTransitionController).mockClear();
  vi.mocked(createBadgeTransitionController).mockImplementation(() =>
    mockTransitionController(),
  );
});

const badgeOf = (root: HTMLElement) => root.querySelector('span > span') as HTMLElement;
const visibleTextOf = (root: HTMLElement) =>
  (root.querySelector('[aria-hidden="true"]')?.textContent ?? '').trim();

describe('Badge', () => {
  it('wraps what it marks, so the anchor needs no positioning of its own', () => {
    const { container } = render(Fixture, { props: { description: '3 unread' } });

    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(container.firstElementChild?.className).toContain('relative');
  });

  it('renders the small dot when there is nothing to show', () => {
    const { container } = render(Badge, { props: { description: 'Unread' } });

    const badge = badgeOf(container);
    expect(visibleTextOf(container)).toBe('');
    expect(badge.className).toContain('size-1.5');
    expect(badge.className).not.toContain('h-4');
  });

  it('renders the large pill as soon as there is a label', () => {
    const { container } = render(Badge, { props: { label: 3, description: '3 unread' } });

    const badge = badgeOf(container);
    expect(visibleTextOf(container)).toBe('3');
    expect(badge.className).toContain('h-4');
    expect(badge.className).not.toContain('size-1.5');
  });

  it('caps a count the way Material spells it', () => {
    const { container } = render(Badge, { props: { label: 100, max: 99, description: '99+ unread' } });

    expect(visibleTextOf(container)).toBe('99+');
  });

  it('shows a zero count rather than treating it as absent', () => {
    const { container } = render(Badge, { props: { label: 0, description: 'No unread' } });

    expect(visibleTextOf(container)).toBe('0');
    expect(badgeOf(container).className).toContain('h-4');
  });

  it('anchors to the leading edge so a widening count does not move it', () => {
    const { container } = render(Badge, { props: { label: 1, description: '1 unread' } });
    const { container: wide } = render(Badge, { props: { label: 999, description: '999 unread' } });

    expect(badgeOf(container).className).toContain('start-[calc(100%-12px)]');
    expect(badgeOf(wide).className).toContain('start-[calc(100%-12px)]');
  });

  it('uses logical offsets, which is what flips it for right-to-left', () => {
    const { container } = render(Badge, { props: { label: 3, description: '3 unread' } });

    const badge = badgeOf(container).className;
    expect(badge).toContain('start-[');
    expect(badge).not.toContain('left-[');
    expect(badge).not.toContain('right-[');
  });

  it('names the live region by its content rather than an aria-label', () => {
    const { container } = render(Badge, { props: { label: 3, description: '3 unread messages' } });

    const live = screen.getByRole('status');
    expect(live).not.toHaveAttribute('aria-label');
    expect(live.textContent).toContain('3 unread messages');
    expect(visibleTextOf(container)).toBe('3');
  });

  it('hides itself from assistive tech when it has no description', () => {
    const { container } = render(Badge, { props: { label: 3 } });

    expect(screen.queryByRole('status')).toBeNull();
    expect(badgeOf(container)).toHaveAttribute('aria-hidden', 'true');
  });

  it('uses the error colour roles Material mandates', () => {
    const { container } = render(Badge, { props: { label: 3, description: '3 unread' } });

    const badge = badgeOf(container).className;
    expect(badge).toContain('bg-error');
    expect(badge).toContain('text-on-error');
  });

  it('has no automated accessibility violations', async () => {
    const { container } = render(Fixture, {
      props: { label: 3, description: '3 unread messages', child: 'button' },
    });

    expect(await axe(container)).toHaveNoViolations();
  });

  it('never clamps or truncates its label', () => {
    const { container } = render(Badge, { props: { label: 999, max: 999, description: '999 unread' } });

    const badge = badgeOf(container);
    expect(visibleTextOf(container)).toBe('999');
    expect(badge.className).not.toContain('max-w-');
    expect(badge.querySelector('span')?.className).not.toContain('truncate');
  });

  it('keeps a long label whole rather than cutting it', () => {
    const { container } = render(Badge, { props: { label: 'BETA RELEASE', description: 'Beta release' } });

    expect(visibleTextOf(container)).toBe('BETA RELEASE');
  });

  it('carries the description as live-region content, not only as a label', () => {
    render(Badge, { props: { label: 3, description: '3 unread messages' } });

    expect(screen.getByRole('status').textContent).toContain('3 unread messages');
  });

  it('hides the visible digit from assistive tech, so it is not read twice', () => {
    const { container } = render(Badge, { props: { label: 3, description: '3 unread messages' } });

    expect(container.querySelector('[aria-hidden="true"]')?.textContent).toBe('3');
    expect(screen.getByRole('status')).toHaveTextContent('3 unread messages');
  });

  it('announces the small dot, which has no visible text at all', () => {
    render(Badge, { props: { description: 'You have unread messages' } });

    expect(screen.getByRole('status').textContent).toContain('You have unread messages');
  });

  it('applies class to the container and classes to the element map', () => {
    const { container } = render(Badge, {
      props: { label: 3, description: '3 unread', class: 'mt-4', classes: () => ({ badge: 'ring-2' }) },
    });

    expect(container.firstElementChild?.className).toContain('mt-4');
    expect(badgeOf(container).className).toContain('ring-2');
  });

  it('connects the shared show/hide transition, instantly on first paint', async () => {
    const controller = mockTransitionController();
    vi.mocked(createBadgeTransitionController).mockReturnValue(controller);
    const { container, rerender } = render(Badge, {
      props: { label: 3, description: '3 unread', transition: { duration: 50 } },
    });

    expect(createBadgeTransitionController).toHaveBeenCalledWith(
      expect.objectContaining({ element: badgeOf(container), transition: { duration: 50 } }),
    );
    expect(controller.setVisible).toHaveBeenCalledWith(true, true);

    await rerender({ label: 3, description: '3 unread', transition: { duration: 50 }, visible: false });
    flushSync();
    expect(controller.setVisible).toHaveBeenLastCalledWith(false);
    expect(controller.setVisible).toHaveBeenCalledTimes(2);
    expect(createBadgeTransitionController).toHaveBeenCalledTimes(1);
  });

  it('stays mounted but leaves the accessibility tree while not visible', async () => {
    const { container, rerender } = render(Badge, {
      props: { label: 3, description: '3 unread', visible: false },
    });

    const badge = badgeOf(container);
    expect(badge.style.visibility).toBe('hidden');
    expect(badge.getAttribute('role')).toBeNull();
    expect(badge.getAttribute('aria-hidden')).toBe('true');
    expect(badge.querySelector('span')?.textContent).toBe('3');

    await rerender({ label: 3, description: '3 unread', visible: true });
    expect(badge.getAttribute('role')).toBe('status');
    // The controller owns visibility from here; Svelte must not fight it.
    expect(badge.style.visibility).toBe('hidden');
  });

  it('tears the transition down on unmount', () => {
    const controller = mockTransitionController();
    vi.mocked(createBadgeTransitionController).mockReturnValue(controller);
    const { unmount } = render(Badge, { props: { label: 3, description: '3 unread' } });

    unmount();

    expect(controller.destroy).toHaveBeenCalledOnce();
  });
});
