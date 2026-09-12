// @vitest-environment jsdom

import { animate } from 'animejs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createBadgeAnchorController,
  createBadgeTransitionController,
} from './badge.js';

vi.mock('animejs', () => ({ animate: vi.fn() }));

function badgeElement(): HTMLElement {
  const badge = document.createElement('span');
  badge.className = 'badge';
  return badge;
}

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('badge anchor controller', () => {
  it('appends the badge into the host and makes it the containing block', () => {
    const host = document.createElement('span');
    document.body.appendChild(host);
    const badge = badgeElement();

    const controller = createBadgeAnchorController({ host, badge });

    expect(controller.anchor).toBe(host);
    expect(badge.parentElement).toBe(host);
    expect(host.style.position).toBe('relative');
  });

  it('walks through display: contents hosts to the first box', () => {
    const host = document.createElement('udx-icon');
    host.style.display = 'contents';
    const box = document.createElement('span');
    host.appendChild(box);
    document.body.appendChild(host);
    const badge = badgeElement();

    const controller = createBadgeAnchorController({ host, badge });

    expect(controller.anchor).toBe(box);
    expect(badge.parentElement).toBe(box);
    expect(host.style.position).toBe('');
  });

  it('leaves a box the consumer already positioned alone', () => {
    const host = document.createElement('span');
    host.style.position = 'absolute';
    document.body.appendChild(host);

    const controller = createBadgeAnchorController({ host, badge: badgeElement() });
    controller.destroy();

    expect(host.style.position).toBe('absolute');
  });

  it('puts the badge back after the box re-rendered its content', () => {
    const host = document.createElement('span');
    document.body.appendChild(host);
    const badge = badgeElement();
    const controller = createBadgeAnchorController({ host, badge });

    host.innerHTML = '<svg></svg>';
    expect(badge.parentElement).toBeNull();

    controller.update();

    expect(badge.parentElement).toBe(host);
    expect(host.lastElementChild).toBe(badge);
  });

  it('moves to the new box when the host resolves to a different one', () => {
    const host = document.createElement('udx-icon');
    host.style.display = 'contents';
    const first = document.createElement('span');
    host.appendChild(first);
    document.body.appendChild(host);
    const badge = badgeElement();
    const controller = createBadgeAnchorController({ host, badge });

    const second = document.createElement('span');
    host.replaceChild(second, first);
    controller.update();

    expect(controller.anchor).toBe(second);
    expect(badge.parentElement).toBe(second);
    expect(second.style.position).toBe('relative');
    expect(first.style.position).toBe('');
  });

  it('removes the badge and restores the box on destroy', () => {
    const host = document.createElement('span');
    document.body.appendChild(host);
    const badge = badgeElement();
    const controller = createBadgeAnchorController({ host, badge });

    controller.destroy();

    expect(badge.parentElement).toBeNull();
    expect(host.style.position).toBe('');
  });
});

describe('badge transition controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(animate).mockReturnValue({ pause: vi.fn() } as never);
  });

  it('scales and fades the badge in with the default transition', () => {
    const element = document.createElement('span');
    element.style.visibility = 'hidden';

    createBadgeTransitionController({
      element,
      reducedMotion: () => false,
    }).setVisible(true);

    expect(element.style.visibility).toBe('');
    expect(animate).toHaveBeenCalledWith(
      element,
      expect.objectContaining({
        opacity: 1,
        scale: 1,
        duration: 200,
        ease: 'outCubic',
      }),
    );
  });

  it('scales and fades the badge out, then takes it out of painting', () => {
    const element = document.createElement('span');

    createBadgeTransitionController({
      element,
      reducedMotion: () => false,
    }).setVisible(false);

    const options = vi.mocked(animate).mock.calls[0][1] as {
      opacity: number;
      scale: number;
      onComplete: () => void;
    };
    expect(options).toMatchObject({ opacity: 0, scale: 0 });
    expect(element.style.visibility).toBe('');
    options.onComplete();
    expect(element.style.visibility).toBe('hidden');
  });

  it('jumps to the end state when the user prefers reduced motion, or on first paint', () => {
    const element = document.createElement('span');
    const controller = createBadgeTransitionController({
      element,
      transition: { duration: 500 },
      reducedMotion: () => true,
    });

    controller.setVisible(true);
    expect(animate).toHaveBeenLastCalledWith(
      element,
      expect.objectContaining({ duration: 0 }),
    );

    const instant = createBadgeTransitionController({
      element,
      transition: { duration: 500 },
      reducedMotion: () => false,
    });
    instant.setVisible(false, true);
    expect(animate).toHaveBeenLastCalledWith(
      element,
      expect.objectContaining({ duration: 0 }),
    );
    instant.setVisible(false);
    expect(animate).toHaveBeenLastCalledWith(
      element,
      expect.objectContaining({ duration: 500 }),
    );
  });

  it('interrupts the running animation before starting the next', () => {
    const element = document.createElement('span');
    const first = { pause: vi.fn() };
    const second = { pause: vi.fn() };
    vi.mocked(animate)
      .mockReturnValueOnce(first as never)
      .mockReturnValueOnce(second as never);
    const controller = createBadgeTransitionController({
      element,
      reducedMotion: () => false,
    });

    controller.setVisible(true);
    controller.setVisible(false);
    expect(first.pause).toHaveBeenCalledOnce();

    controller.destroy();
    expect(second.pause).toHaveBeenCalledOnce();
  });
});
